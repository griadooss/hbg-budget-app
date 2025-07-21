import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@homesbeforegrowth.org' },
    update: {},
    create: {
      email: 'admin@homesbeforegrowth.org',
      password: hashedPassword,
      firstName: 'HBG',
      lastName: 'Administrator',
      role: "ADMIN",
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create Transaction Types
  const expenseType = await prisma.transactionType.upsert({
    where: { code: 'EXP' },
    update: {},
    create: {
      code: 'EXP',
      name: 'Expense',
      description: 'All expense transactions',
    },
  });

  const incomeType = await prisma.transactionType.upsert({
    where: { code: 'INC' },
    update: {},
    create: {
      code: 'INC',
      name: 'Income',
      description: 'All income transactions',
    },
  });

  console.log('✅ Created transaction types');

  // Create Expense Categories (based on HBG lookup sheet)
  const expenseCategories = [
    { code: 'EXP_CAT_01', name: 'CAMPAIGN EXPENSES', description: 'Election and campaign related expenses' },
    { code: 'EXP_CAT_02', name: 'ADMINISTRATIVE', description: 'General administrative and operational expenses' },
    { code: 'EXP_CAT_03', name: 'EVENT COSTS', description: 'Event organization and hosting expenses' },
    { code: 'EXP_CAT_04', name: 'TRAVEL EXPENSES', description: 'Travel and transportation costs' },
    { code: 'EXP_CAT_05', name: 'COMMUNICATION', description: 'Communication and technology expenses' },
    { code: 'EXP_CAT_06', name: 'MERCHANDISE', description: 'Promotional materials and merchandise' },
    { code: 'EXP_CAT_07', name: 'COMPLIANCE & LEGAL', description: 'Legal and compliance related expenses' },
    { code: 'EXP_CAT_08', name: 'OTHER EXPENSES', description: 'Miscellaneous expenses' },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        ...cat,
        typeId: expenseType.id,
      },
    });
  }

  // Create Income Categories
  const incomeCategories = [
    { code: 'INC_CAT_01', name: 'MEMBERSHIP DUES', description: 'Annual and monthly membership fees' },
    { code: 'INC_CAT_02', name: 'DONATIONS', description: 'Individual and corporate donations' },
    { code: 'INC_CAT_03', name: 'FUNDRAISING EVENTS', description: 'Income from fundraising activities' },
    { code: 'INC_CAT_04', name: 'GOVERNMENT GRANTS', description: 'Government funding and grants' },
    { code: 'INC_CAT_05', name: 'PARTY CONTRIBUTIONS', description: 'Contributions from party members' },
    { code: 'INC_CAT_06', name: 'MERCHANDISE SALES', description: 'Revenue from merchandise sales' },
    { code: 'INC_CAT_07', name: 'EVENT TICKETS', description: 'Revenue from event ticket sales' },
    { code: 'INC_CAT_08', name: 'OTHER INCOME', description: 'Miscellaneous income sources' },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        ...cat,
        typeId: incomeType.id,
      },
    });
  }

  console.log('✅ Created categories');

  // Create Sub-Categories for Campaign Expenses
  const campaignSubCategories = [
    { code: 'EXP_CAT_01_SUB_01', name: 'Advertising', categoryCode: 'EXP_CAT_01' },
    { code: 'EXP_CAT_01_SUB_02', name: 'Printing', categoryCode: 'EXP_CAT_01' },
    { code: 'EXP_CAT_01_SUB_03', name: 'Signage', categoryCode: 'EXP_CAT_01' },
    { code: 'EXP_CAT_01_SUB_04', name: 'Digital Marketing', categoryCode: 'EXP_CAT_01' },
    { code: 'EXP_CAT_01_SUB_05', name: 'Campaign Materials', categoryCode: 'EXP_CAT_01' },
  ];

  // Create Sub-Categories for Administrative
  const adminSubCategories = [
    { code: 'EXP_CAT_02_SUB_01', name: 'Office Supplies', categoryCode: 'EXP_CAT_02' },
    { code: 'EXP_CAT_02_SUB_02', name: 'Software Licenses', categoryCode: 'EXP_CAT_02' },
    { code: 'EXP_CAT_02_SUB_03', name: 'Website Hosting', categoryCode: 'EXP_CAT_02' },
    { code: 'EXP_CAT_02_SUB_04', name: 'Legal Fees', categoryCode: 'EXP_CAT_02' },
    { code: 'EXP_CAT_02_SUB_05', name: 'Accounting', categoryCode: 'EXP_CAT_02' },
  ];

  // Add more sub-categories for other main categories
  const allSubCategories = [
    ...campaignSubCategories,
    ...adminSubCategories,
    // Event Costs
    { code: 'EXP_CAT_03_SUB_01', name: 'Venue Hire', categoryCode: 'EXP_CAT_03' },
    { code: 'EXP_CAT_03_SUB_02', name: 'Catering', categoryCode: 'EXP_CAT_03' },
    { code: 'EXP_CAT_03_SUB_03', name: 'Equipment Hire', categoryCode: 'EXP_CAT_03' },
    { code: 'EXP_CAT_03_SUB_04', name: 'Entertainment', categoryCode: 'EXP_CAT_03' },
    { code: 'EXP_CAT_03_SUB_05', name: 'Transport', categoryCode: 'EXP_CAT_03' },
    // Travel Expenses
    { code: 'EXP_CAT_04_SUB_01', name: 'Fuel', categoryCode: 'EXP_CAT_04' },
    { code: 'EXP_CAT_04_SUB_02', name: 'Public Transport', categoryCode: 'EXP_CAT_04' },
    { code: 'EXP_CAT_04_SUB_03', name: 'Accommodation', categoryCode: 'EXP_CAT_04' },
    { code: 'EXP_CAT_04_SUB_04', name: 'Meals', categoryCode: 'EXP_CAT_04' },
    // Communication
    { code: 'EXP_CAT_05_SUB_01', name: 'Phone Bills', categoryCode: 'EXP_CAT_05' },
    { code: 'EXP_CAT_05_SUB_02', name: 'Internet', categoryCode: 'EXP_CAT_05' },
    { code: 'EXP_CAT_05_SUB_03', name: 'Postage', categoryCode: 'EXP_CAT_05' },
    { code: 'EXP_CAT_05_SUB_04', name: 'Social Media', categoryCode: 'EXP_CAT_05' },
    // Merchandise
    { code: 'EXP_CAT_06_SUB_01', name: 'T-Shirts', categoryCode: 'EXP_CAT_06' },
    { code: 'EXP_CAT_06_SUB_02', name: 'Banners', categoryCode: 'EXP_CAT_06' },
    { code: 'EXP_CAT_06_SUB_03', name: 'Pamphlets', categoryCode: 'EXP_CAT_06' },
    { code: 'EXP_CAT_06_SUB_04', name: 'Stickers', categoryCode: 'EXP_CAT_06' },
    // Compliance & Legal
    { code: 'EXP_CAT_07_SUB_01', name: 'Electoral Commission', categoryCode: 'EXP_CAT_07' },
    { code: 'EXP_CAT_07_SUB_02', name: 'Legal Advice', categoryCode: 'EXP_CAT_07' },
    { code: 'EXP_CAT_07_SUB_03', name: 'Compliance Reports', categoryCode: 'EXP_CAT_07' },
    // Other
    { code: 'EXP_CAT_08_SUB_01', name: 'Miscellaneous', categoryCode: 'EXP_CAT_08' },
  ];

  for (const subCat of allSubCategories) {
    const category = await prisma.category.findUnique({
      where: { code: subCat.categoryCode },
    });
    
    if (category) {
      await prisma.subCategory.upsert({
        where: { code: subCat.code },
        update: {},
        create: {
          code: subCat.code,
          name: subCat.name,
          categoryId: category.id,
        },
      });
    }
  }

  console.log('✅ Created sub-categories');

  // Create default bank accounts based on the spreadsheet
  const bankAccounts = [
    {
      bankName: 'UBank',
      accountName: 'HBG-UB - Main Cheque Account',
      accountNumber: '1048-0192',
      bsb: '670-864',
      accountType: 'Cheque',
      openingBalance: 0,
    },
    {
      bankName: 'UBank',
      accountName: 'HBG-UB - Savings Account',
      accountNumber: '2224-7689',
      bsb: '670-864',
      accountType: 'Savings',
      openingBalance: 0,
    },
    {
      bankName: 'NAB',
      accountName: 'HBG-NAB - Business Account',
      accountNumber: '68923-3957',
      bsb: '082-133',
      accountType: 'Business',
      openingBalance: 0,
    },
    {
      bankName: 'CASH',
      accountName: 'HBG-CASH - Petty Cash',
      accountNumber: null,
      bsb: null,
      accountType: 'Cash',
      openingBalance: 0,
    },
  ];

  for (const account of bankAccounts) {
    await prisma.bankAccount.upsert({
      where: { 
        accountName: account.accountName,
      },
      update: {},
      create: {
        ...account,
        currentBalance: account.openingBalance,
      },
    });
  }

  console.log('✅ Created bank accounts');

  // Create system configuration
  const systemConfigs = [
    { key: 'PARTY_NAME', value: 'Homes Before Growth' },
    { key: 'PARTY_ABN', value: 'TO_BE_CONFIGURED' },
    { key: 'FINANCIAL_YEAR_START', value: '07-01' },
    { key: 'REPORTING_THRESHOLD', value: '13800' },
    { key: 'DEFAULT_CURRENCY', value: 'AUD' },
    { key: 'PUBLIC_DASHBOARD_ENABLED', value: 'true' },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('✅ Created system configuration');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 