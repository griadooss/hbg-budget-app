import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireTreasurer, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all bank accounts
router.get('/', asyncHandler(async (req, res) => {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { bankName: 'asc' },
  });

  res.json({ bankAccounts });
}));

// Get single bank account with transaction summary
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!bankAccount) {
    throw createError('Bank account not found', 404);
  }

  // Get transaction summary for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [recentTransactions, monthlyActivity] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        bankAccountId: id,
        date: { gte: twelveMonthsAgo },
      },
      take: 10,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        description: true,
        amount: true,
        isIncome: true,
        reference: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        bankAccountId: id,
        date: { gte: twelveMonthsAgo },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  res.json({
    bankAccount,
    summary: {
              totalActivity: Number(monthlyActivity._sum.amount || 0),
      transactionCount: monthlyActivity._count.id,
      recentTransactions,
    },
  });
}));

// Create new bank account
router.post('/', requireTreasurer, [
  body('bankName').notEmpty().withMessage('Bank name is required'),
  body('accountName').notEmpty().withMessage('Account name is required'),
  body('accountType').notEmpty().withMessage('Account type is required'),
  body('accountNumber').optional().isString(),
  body('bsb').optional().isString(),
  body('openingBalance').optional().isDecimal().withMessage('Opening balance must be decimal'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    bankName,
    accountName,
    accountType,
    accountNumber,
    bsb,
    openingBalance,
  } = req.body;

  // Check if account name is unique
  const existingAccount = await prisma.bankAccount.findFirst({
    where: { accountName },
  });

  if (existingAccount) {
    throw createError('Account name already exists', 409);
  }

  const openingBal = openingBalance ? parseFloat(openingBalance) : 0;

  const bankAccount = await prisma.bankAccount.create({
    data: {
      bankName,
      accountName,
      accountType,
      accountNumber: accountNumber || null,
      bsb: bsb || null,
      openingBalance: openingBal,
      currentBalance: openingBal,
    },
  });

  res.status(201).json({
    message: 'Bank account created successfully',
    bankAccount,
  });
}));

// Update bank account
router.put('/:id', requireTreasurer, [
  body('bankName').optional().notEmpty().withMessage('Bank name cannot be empty'),
  body('accountName').optional().notEmpty().withMessage('Account name cannot be empty'),
  body('accountType').optional().notEmpty().withMessage('Account type cannot be empty'),
  body('accountNumber').optional().isString(),
  body('bsb').optional().isString(),
  body('isActive').optional().isBoolean().withMessage('Active status must be boolean'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData = req.body;

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
  });

  if (!bankAccount) {
    throw createError('Bank account not found', 404);
  }

  // Check if new account name is unique (if being updated)
  if (updateData.accountName && updateData.accountName !== bankAccount.accountName) {
    const existingAccount = await prisma.bankAccount.findFirst({
      where: { 
        accountName: updateData.accountName,
        id: { not: id },
      },
    });

    if (existingAccount) {
      throw createError('Account name already exists', 409);
    }
  }

  const updatedBankAccount = await prisma.bankAccount.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: 'Bank account updated successfully',
    bankAccount: updatedBankAccount,
  });
}));

// Reconcile bank account balance
router.post('/:id/reconcile', requireTreasurer, [
  body('actualBalance').isDecimal().withMessage('Actual balance is required'),
  body('reconciliationDate').isISO8601().withMessage('Valid reconciliation date is required'),
  body('notes').optional().isString(),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const { actualBalance, reconciliationDate, notes } = req.body;

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id },
  });

  if (!bankAccount) {
    throw createError('Bank account not found', 404);
  }

  const actualBal = parseFloat(actualBalance);
  const currentBal = Number(bankAccount.currentBalance);
  const difference = actualBal - currentBal;

  // If there's a difference, create an adjustment transaction
  if (Math.abs(difference) > 0.01) { // Allow for rounding differences
    await prisma.transaction.create({
      data: {
        date: new Date(reconciliationDate),
        description: `Balance reconciliation adjustment - ${notes || 'Bank reconciliation'}`,
        amount: Math.abs(difference),
        isIncome: difference > 0,
        bankAccountId: id,
        reference: 'RECONCILIATION',
        notes: `Adjustment for reconciliation. Expected: ${currentBal}, Actual: ${actualBal}`,
        financialYear: '2024-25', // This should be calculated properly
        quarter: 1, // This should be calculated properly
        createdById: req.user!.id,
        isCompliant: true,
        complianceNotes: 'Reconciliation adjustment',
      },
    });
  }

  // Update bank account balance
  const updatedBankAccount = await prisma.bankAccount.update({
    where: { id },
    data: {
      currentBalance: actualBal,
    },
  });

  // Mark recent transactions as reconciled
  await prisma.transaction.updateMany({
    where: {
      bankAccountId: id,
      date: { lte: new Date(reconciliationDate) },
      isReconciled: false,
    },
    data: {
      isReconciled: true,
      reconciledAt: new Date(),
    },
  });

  res.json({
    message: 'Bank account reconciled successfully',
    bankAccount: updatedBankAccount,
    adjustmentAmount: difference,
    adjustmentApplied: Math.abs(difference) > 0.01,
  });
}));

// Get bank account transaction history
router.get('/:id/transactions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { bankAccountId: id },
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
      },
    }),
    prisma.transaction.count({ where: { bankAccountId: id } }),
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

// Deactivate bank account
router.delete('/:id', requireTreasurer, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Check if account has transactions
  const transactionCount = await prisma.transaction.count({
    where: { bankAccountId: id },
  });

  if (transactionCount > 0) {
    // Soft delete only - set as inactive
    await prisma.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Bank account deactivated successfully (has associated transactions)',
    });
  } else {
    // Hard delete if no transactions
    await prisma.bankAccount.delete({
      where: { id },
    });

    res.json({
      message: 'Bank account deleted successfully',
    });
  }
}));

// Get all bank account balances summary
router.get('/summary/balances', asyncHandler(async (req, res) => {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      bankName: true,
      accountName: true,
      accountType: true,
      currentBalance: true,
      openingBalance: true,
    },
    orderBy: { bankName: 'asc' },
  });

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + Number(account.currentBalance),
    0
  );

  const totalOpening = bankAccounts.reduce(
    (sum, account) => sum + Number(account.openingBalance),
    0
  );

  res.json({
    bankAccounts,
    summary: {
      totalCurrentBalance: totalBalance,
      totalOpeningBalance: totalOpening,
      netChange: totalBalance - totalOpening,
      accountCount: bankAccounts.length,
    },
  });
}));

export default router; 