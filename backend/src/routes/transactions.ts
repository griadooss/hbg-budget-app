import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireUser, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all transactions with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('categoryId').optional().isString().withMessage('Category ID must be a string'),
  query('bankAccountId').optional().isString().withMessage('Bank Account ID must be a string'),
  query('isIncome').optional().isBoolean().withMessage('isIncome must be a boolean'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;
  const bankAccountId = req.query.bankAccountId as string;
  const isIncome = req.query.isIncome === 'true' ? true : req.query.isIncome === 'false' ? false : undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (categoryId) where.categoryId = categoryId;
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (isIncome !== undefined) where.isIncome = isIncome;
  
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  // Get transactions and total count
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { id: true, name: true, code: true } },
        subCategory: { select: { id: true, name: true, code: true } },
        bankAccount: { select: { id: true, bankName: true, accountName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    transactions,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}));

// Get single transaction
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, code: true } },
      subCategory: { select: { id: true, name: true, code: true } },
      bankAccount: { select: { id: true, bankName: true, accountName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  res.json({ transaction });
}));

// Create new transaction
router.post('/', requireUser, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount is required'),
  body('isIncome').isBoolean().withMessage('Income flag is required'),
  body('bankAccountId').isString().withMessage('Bank account is required'),
  body('categoryId').optional().isString().withMessage('Category ID must be string'),
  body('subCategoryId').optional().isString().withMessage('Sub-category ID must be string'),
  body('reference').optional().isString().withMessage('Reference must be string'),
  body('notes').optional().isString().withMessage('Notes must be string'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    date,
    description,
    amount,
    isIncome,
    bankAccountId,
    categoryId,
    subCategoryId,
    reference,
    notes,
  } = req.body;

  // Validate bank account exists
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw createError('Bank account not found', 404);
  }

  // Calculate financial year (July to June)
  const transactionDate = new Date(date);
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth() + 1;
  const financialYear = month >= 7 ? `${year}-${(year + 1).toString().slice(2)}` : `${year - 1}-${year.toString().slice(2)}`;

  // Calculate quarter
  const quarter = Math.ceil(((month + 5) % 12 + 1) / 3);

  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      isIncome,
      bankAccountId,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      reference: reference || null,
      notes: notes || null,
      financialYear,
      quarter,
      createdById: req.user!.id,
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
      subCategory: { select: { id: true, name: true, code: true } },
      bankAccount: { select: { id: true, bankName: true, accountName: true } },
    },
  });

  // Update bank account balance
  const balanceChange = isIncome ? parseFloat(amount) : -parseFloat(amount);
  await prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: {
      currentBalance: {
        increment: balanceChange,
      },
    },
  });

  res.status(201).json({
    message: 'Transaction created successfully',
    transaction,
  });
}));

// Update transaction
router.put('/:id', requireUser, [
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount required'),
  body('isIncome').optional().isBoolean().withMessage('Income flag must be boolean'),
  body('categoryId').optional().isString().withMessage('Category ID must be string'),
  body('subCategoryId').optional().isString().withMessage('Sub-category ID must be string'),
  body('reference').optional().isString().withMessage('Reference must be string'),
  body('notes').optional().isString().withMessage('Notes must be string'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData = req.body;

  // Get existing transaction
  const existingTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: { bankAccount: true },
  });

  if (!existingTransaction) {
    throw createError('Transaction not found', 404);
  }

  // Reverse the previous balance change
  const previousBalanceChange = existingTransaction.isIncome 
    ? -Number(existingTransaction.amount) 
    : Number(existingTransaction.amount);

  // Calculate new financial year and quarter if date is updated
  if (updateData.date) {
    const transactionDate = new Date(updateData.date);
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth() + 1;
    updateData.financialYear = month >= 7 ? `${year}-${(year + 1).toString().slice(2)}` : `${year - 1}-${year.toString().slice(2)}`;
    updateData.quarter = Math.ceil(((month + 5) % 12 + 1) / 3);
  }

  // Update transaction
  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: req.user!.id,
      date: updateData.date ? new Date(updateData.date) : undefined,
      amount: updateData.amount ? parseFloat(updateData.amount) : undefined,
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
      subCategory: { select: { id: true, name: true, code: true } },
      bankAccount: { select: { id: true, bankName: true, accountName: true } },
    },
  });

  // Apply new balance change
  const newIsIncome = updateData.isIncome !== undefined ? updateData.isIncome : existingTransaction.isIncome;
  const newAmount = updateData.amount !== undefined ? parseFloat(updateData.amount) : Number(existingTransaction.amount);
  const newBalanceChange = newIsIncome ? newAmount : -newAmount;

  await prisma.bankAccount.update({
    where: { id: existingTransaction.bankAccountId },
    data: {
      currentBalance: {
        increment: previousBalanceChange + newBalanceChange,
      },
    },
  });

  res.json({
    message: 'Transaction updated successfully',
    transaction: updatedTransaction,
  });
}));

// Delete transaction
router.delete('/:id', requireUser, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { bankAccount: true },
  });

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  // Reverse the balance change
  const balanceChange = transaction.isIncome 
    ? -Number(transaction.amount) 
    : Number(transaction.amount);

  await Promise.all([
    prisma.transaction.delete({ where: { id } }),
    prisma.bankAccount.update({
      where: { id: transaction.bankAccountId },
      data: {
        currentBalance: {
          increment: balanceChange,
        },
      },
    }),
  ]);

  res.json({
    message: 'Transaction deleted successfully',
  });
}));

// Get transaction summary
router.get('/summary/financial-year/:year', asyncHandler(async (req, res) => {
  const { year } = req.params;

  const [totalIncome, totalExpenses, transactionCount, categoryBreakdown] = await Promise.all([
    prisma.transaction.aggregate({
      where: { isIncome: true, financialYear: year },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { isIncome: false, financialYear: year },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { financialYear: year },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { financialYear: year },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  res.json({
    financialYear: year,
    summary: {
      totalIncome: Number(totalIncome._sum.amount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      netPosition: Number(totalIncome._sum.amount || 0) - Number(totalExpenses._sum.amount || 0),
      transactionCount,
    },
    categoryBreakdown,
  });
}));

export default router; 