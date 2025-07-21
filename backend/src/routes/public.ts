import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Public financial summary
router.get('/financial-summary', asyncHandler(async (req, res) => {
  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;

  // Get total income and expenses for current financial year
  const [totalIncome, totalExpenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        isIncome: true,
        financialYear,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        isIncome: false,
        financialYear,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // Get category breakdown for expenses
  const expensesByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      isIncome: false,
      financialYear,
    },
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get category details
  const categoryDetails = await prisma.category.findMany({
    where: {
      id: {
        in: expensesByCategory.map(item => item.categoryId).filter(Boolean) as string[],
      },
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  const categorizedExpenses = expensesByCategory.map(expense => {
    const category = categoryDetails.find(cat => cat.id === expense.categoryId);
    return {
      category: category?.name || 'Uncategorized',
      categoryCode: category?.code || 'UNKNOWN',
              amount: Number(expense._sum.amount || 0),
      transactionCount: expense._count.id,
    };
  }).sort((a, b) => Number(b.amount) - Number(a.amount));

  // Get recent transactions (last 10, without sensitive details)
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: {
      date: 'desc',
    },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      isIncome: true,
      category: {
        select: {
          name: true,
        },
      },
      subCategory: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get party information
  const partyInfo = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: ['PARTY_NAME', 'PARTY_ABN'],
      },
    },
  });

  const partyName = partyInfo.find(config => config.key === 'PARTY_NAME')?.value || 'Homes Before Growth';
  const partyABN = partyInfo.find(config => config.key === 'PARTY_ABN')?.value;

  res.json({
    party: {
      name: partyName,
      abn: partyABN !== 'TO_BE_CONFIGURED' ? partyABN : null,
    },
    financialYear,
    summary: {
      totalIncome: Number(totalIncome._sum.amount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      netPosition: Number(totalIncome._sum.amount || 0) - Number(totalExpenses._sum.amount || 0),
    },
    expensesByCategory: categorizedExpenses,
    recentTransactions: recentTransactions.map(tx => ({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.isIncome ? 'Income' : 'Expense',
      category: tx.category?.name,
      subCategory: tx.subCategory?.name,
    })),
    lastUpdated: new Date().toISOString(),
  });
}));

// Public quarterly reports
router.get('/quarterly-reports', asyncHandler(async (req, res) => {
  const reports = await prisma.complianceReport.findMany({
    where: {
      status: 'APPROVED',
    },
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
      submittedAt: true,
    },
    orderBy: [
      { financialYear: 'desc' },
      { quarter: 'desc' },
    ],
  });

  res.json({
    reports,
    count: reports.length,
  });
}));

// Public annual summary
router.get('/annual-summary/:year', asyncHandler(async (req, res) => {
  const { year } = req.params;
  const financialYear = year;

  // Monthly breakdown
  const monthlyData = await prisma.transaction.groupBy({
    by: ['financialYear'],
    where: {
      financialYear,
    },
    _sum: {
      amount: true,
    },
  });

  // Get transactions grouped by month
  const transactions = await prisma.transaction.findMany({
    where: {
      financialYear,
    },
    select: {
      date: true,
      amount: true,
      isIncome: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  // Group by month
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = transactions.filter(tx => 
      new Date(tx.date).getMonth() + 1 === month
    );

    const income = monthTransactions
      .filter(tx => tx.isIncome)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expenses = monthTransactions
      .filter(tx => !tx.isIncome)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      month,
      monthName: new Date(2024, i).toLocaleString('default', { month: 'long' }),
      income,
      expenses,
      net: income - expenses,
      transactionCount: monthTransactions.length,
    };
  });

  res.json({
    financialYear,
    monthlyBreakdown,
    summary: {
      totalIncome: monthlyBreakdown.reduce((sum, m) => sum + m.income, 0),
      totalExpenses: monthlyBreakdown.reduce((sum, m) => sum + m.expenses, 0),
      averageMonthlyIncome: monthlyBreakdown.reduce((sum, m) => sum + m.income, 0) / 12,
      averageMonthlyExpenses: monthlyBreakdown.reduce((sum, m) => sum + m.expenses, 0) / 12,
    },
  });
}));

export default router; 