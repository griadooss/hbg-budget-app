import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireTreasurer, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get financial summary report
router.get('/financial-summary', [
  query('startDate').isISO8601().withMessage('Valid start date is required'),
  query('endDate').isISO8601().withMessage('Valid end date is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const startDate = new Date(req.query.startDate as string);
  const endDate = new Date(req.query.endDate as string);

  // Get summary totals
  const [incomeTotal, expenseTotal, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        isIncome: true,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        isIncome: false,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  // Get income breakdown by category
  const incomeByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      isIncome: true,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Get expense breakdown by category
  const expensesByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      isIncome: false,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  // Get category details
  const categoryIds = [
    ...incomeByCategory.map(item => item.categoryId),
    ...expensesByCategory.map(item => item.categoryId),
  ].filter(Boolean) as string[];

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, code: true },
  });

  // Format results
  const formatCategoryBreakdown = (data: any[]) => {
    return data.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryCode: category?.code || 'UNKNOWN',
                  amount: Number(item._sum.amount || 0),
        transactionCount: item._count.id,
      };
    }).sort((a, b) => Number(b.amount) - Number(a.amount));
  };

  // Monthly breakdown
  const monthlyData = await prisma.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      amount: true,
      isIncome: true,
    },
  });

  // Group by month
  const monthlyBreakdown = monthlyData.reduce((acc: any, transaction) => {
    const monthKey = transaction.date.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[monthKey]) {
      acc[monthKey] = { income: 0, expenses: 0, net: 0 };
    }
    
    if (transaction.isIncome) {
      acc[monthKey].income += Number(transaction.amount);
    } else {
      acc[monthKey].expenses += Number(transaction.amount);
    }
    acc[monthKey].net = acc[monthKey].income - acc[monthKey].expenses;
    
    return acc;
  }, {});

  res.json({
    reportPeriod: {
      startDate,
      endDate,
    },
    summary: {
              totalIncome: Number(incomeTotal._sum.amount || 0),
        totalExpenses: Number(expenseTotal._sum.amount || 0),
        netPosition: Number(incomeTotal._sum.amount || 0) - Number(expenseTotal._sum.amount || 0),
      transactionCount,
    },
    incomeBreakdown: formatCategoryBreakdown(incomeByCategory),
    expenseBreakdown: formatCategoryBreakdown(expensesByCategory),
    monthlyBreakdown,
    generatedAt: new Date().toISOString(),
  });
}));

// Get compliance report
router.get('/compliance/:reportType', [
  query('financialYear').notEmpty().withMessage('Financial year is required'),
  query('quarter').optional().isInt({ min: 1, max: 4 }).withMessage('Quarter must be 1-4'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { reportType } = req.params;
  const { financialYear, quarter } = req.query;

  // Validate report type
  const validReportTypes = ['annual', 'quarterly', 'disclosure'];
  if (!validReportTypes.includes(reportType)) {
    throw createError('Invalid report type', 400);
  }

  // Build where clause for transactions
  const where: any = { financialYear: financialYear as string };
  if (quarter && reportType === 'quarterly') {
    where.quarter = parseInt(quarter as string);
  }

  // Get financial data
  const [transactions, bankAccountBalances] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true, code: true } },
        subCategory: { select: { name: true, code: true } },
        bankAccount: { select: { bankName: true, accountName: true } },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.bankAccount.findMany({
      where: { isActive: true },
      select: {
        bankName: true,
        accountName: true,
        currentBalance: true,
      },
    }),
  ]);

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.isIncome)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => !t.isIncome)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Group transactions by category for detailed breakdown
  const categoryBreakdown = transactions.reduce((acc: any, transaction) => {
    const categoryKey = transaction.category?.code || 'UNCATEGORIZED';
    if (!acc[categoryKey]) {
      acc[categoryKey] = {
        categoryName: transaction.category?.name || 'Uncategorized',
        categoryCode: categoryKey,
        transactions: [],
        total: 0,
      };
    }
    
    acc[categoryKey].transactions.push({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      reference: transaction.reference,
      subCategory: transaction.subCategory?.name,
    });
    
    acc[categoryKey].total += Number(transaction.amount);
    
    return acc;
  }, {});

  res.json({
    reportType,
    financialYear,
    quarter: quarter ? parseInt(quarter as string) : null,
    summary: {
      totalIncome,
      totalExpenses,
      netPosition: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    },
    categoryBreakdown: Object.values(categoryBreakdown),
    bankAccountBalances,
    complianceInfo: {
      reportingThreshold: 13800, // Australian political party threshold
      exceedsThreshold: totalIncome > 13800 || totalExpenses > 13800,
      requiresDisclosure: reportType === 'disclosure',
    },
    generatedAt: new Date().toISOString(),
  });
}));

// Create and save compliance report
router.post('/compliance', requireTreasurer, [
  body('reportType').isIn(['Annual Return', 'Quarterly Report', 'Disclosure Statement']).withMessage('Valid report type required'),
  body('financialYear').notEmpty().withMessage('Financial year is required'),
  body('quarter').optional().isInt({ min: 1, max: 4 }).withMessage('Quarter must be 1-4'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const {
    reportType,
    financialYear,
    quarter,
    startDate,
    endDate,
  } = req.body;

  // Get data for the report period
  const where: any = {
    date: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  const [totalIncome, totalExpenses, detailedData] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, isIncome: true },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, isIncome: false },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true, code: true } },
        subCategory: { select: { name: true, code: true } },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

      const income = Number(totalIncome._sum.amount || 0);
    const expenses = Number(totalExpenses._sum.amount || 0);

  // Create the compliance report
  const report = await prisma.complianceReport.create({
    data: {
      reportType,
      financialYear,
      quarter: quarter || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalIncome: income,
      totalExpenses: expenses,
      netPosition: income - expenses,
      reportData: JSON.stringify({
        transactions: detailedData.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          isIncome: t.isIncome,
          category: t.category?.name,
          subCategory: t.subCategory?.name,
          reference: t.reference,
        })),
        categoryBreakdown: detailedData.reduce((acc: any, t) => {
          const key = t.category?.code || 'UNCATEGORIZED';
          if (!acc[key]) {
            acc[key] = { name: t.category?.name || 'Uncategorized', total: 0 };
          }
          acc[key].total += Number(t.amount);
          return acc;
        }, {}),
      }),
      status: 'DRAFT',
    },
  });

  res.status(201).json({
    message: 'Compliance report created successfully',
    report: {
      id: report.id,
      reportType: report.reportType,
      financialYear: report.financialYear,
      quarter: report.quarter,
      totalIncome: report.totalIncome,
      totalExpenses: report.totalExpenses,
      netPosition: report.netPosition,
      status: report.status,
      createdAt: report.createdAt,
    },
  });
}));

// Get all compliance reports
router.get('/compliance', asyncHandler(async (req, res) => {
  const reports = await prisma.complianceReport.findMany({
    select: {
      id: true,
      reportType: true,
      financialYear: true,
      quarter: true,
      startDate: true,
      endDate: true,
      totalIncome: true,
      totalExpenses: true,
      netPosition: true,
      status: true,
      submittedAt: true,
      createdAt: true,
    },
    orderBy: [
      { financialYear: 'desc' },
      { quarter: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  res.json({ reports });
}));

// Update compliance report status
router.patch('/compliance/:id/status', requireTreasurer, [
  body('status').isIn(['DRAFT', 'SUBMITTED', 'APPROVED']).withMessage('Valid status required'),
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const { status } = req.body;

  const updateData: any = { status };
  
  if (status === 'SUBMITTED') {
    updateData.submittedAt = new Date();
  } else if (status === 'APPROVED') {
    updateData.approvedAt = new Date();
  }

  const report = await prisma.complianceReport.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      reportType: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
    },
  });

  res.json({
    message: 'Report status updated successfully',
    report,
  });
}));

// Export transactions as CSV
router.get('/export/transactions', [
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('format').optional().isIn(['csv', 'json']).withMessage('Format must be csv or json'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const format = req.query.format as string || 'csv';

  const where: any = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: { select: { name: true, code: true } },
      subCategory: { select: { name: true, code: true } },
      bankAccount: { select: { bankName: true, accountName: true } },
    },
    orderBy: { date: 'asc' },
  });

  const exportData = transactions.map(t => ({
    Date: t.date.toISOString().split('T')[0],
    Description: t.description,
    Amount: t.amount,
    Type: t.isIncome ? 'Income' : 'Expense',
    Category: t.category?.name || '',
    SubCategory: t.subCategory?.name || '',
    BankAccount: `${t.bankAccount.bankName} - ${t.bankAccount.accountName}`,
    Reference: t.reference || '',
    FinancialYear: t.financialYear,
    Notes: t.notes || '',
  }));

  if (format === 'json') {
    res.json({
      exportData,
      totalRecords: exportData.length,
      exportedAt: new Date().toISOString(),
    });
  } else {
    // CSV format
    const csvHeader = Object.keys(exportData[0] || {}).join(',');
    const csvRows = exportData.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  }
}));

export default router; 