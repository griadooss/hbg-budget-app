import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireTreasurer, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories with subcategories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      subCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      transactionType: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json(categories);
}));

// Get categories by transaction type
router.get('/by-type/:typeCode', asyncHandler(async (req, res) => {
  const { typeCode } = req.params;

  const transactionType = await prisma.transactionType.findUnique({
    where: { code: typeCode },
  });

  if (!transactionType) {
    throw createError('Transaction type not found', 404);
  }

  const categories = await prisma.category.findMany({
    where: {
      typeId: transactionType.id,
      isActive: true,
    },
    include: {
      subCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ categories });
}));

// Get single category with subcategories
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      subCategories: {
        orderBy: { sortOrder: 'asc' },
      },
      transactionType: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!category) {
    throw createError('Category not found', 404);
  }

  res.json({ category });
}));

// Create new category
router.post('/', [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { name, description } = req.body;

  // Auto-generate code from name
  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);

  // Check if code is unique, add number if needed
  let finalCode = code;
  let counter = 1;
  let existingCategory = await prisma.category.findUnique({
    where: { code: finalCode },
  });

  while (existingCategory) {
    finalCode = `${code}_${counter}`;
    existingCategory = await prisma.category.findUnique({
      where: { code: finalCode },
    });
    counter++;
  }

  const category = await prisma.category.create({
    data: {
      name,
      code: finalCode,
      description: description || null,
      sortOrder: 0,
    },
  });

  res.status(201).json({
    message: 'Category created successfully',
    category,
  });
}));

// Update category
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().isString(),
  body('sortOrder').optional().isInt().withMessage('Sort order must be integer'),
  body('isActive').optional().isBoolean().withMessage('Active status must be boolean'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData = req.body;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw createError('Category not found', 404);
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      transactionType: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  res.json({
    message: 'Category updated successfully',
    category: updatedCategory,
  });
}));

// Delete category (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has transactions
  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });

  if (transactionCount > 0) {
    // Soft delete only
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Category deactivated successfully (has associated transactions)',
    });
  } else {
    // Hard delete if no transactions
    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: 'Category deleted successfully',
    });
  }
}));

// SUBCATEGORIES

// Get subcategories for a category
router.get('/:categoryId/subcategories', asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const subCategories = await prisma.subCategory.findMany({
    where: {
      categoryId,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ subCategories });
}));

// Create subcategory
router.post('/:categoryId/subcategories', [
  body('name').notEmpty().withMessage('Subcategory name is required'),
  body('description').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { categoryId } = req.params;
  const { name, description } = req.body;

  // Auto-generate code from name
  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw createError('Category not found', 404);
  }

  // Check if code is unique, add number if needed
  let finalCode = code;
  let counter = 1;
  let existingSubCategory = await prisma.subCategory.findUnique({
    where: { code: finalCode },
  });

  while (existingSubCategory) {
    finalCode = `${code}_${counter}`;
    existingSubCategory = await prisma.subCategory.findUnique({
      where: { code: finalCode },
    });
    counter++;
  }

  const subCategory = await prisma.subCategory.create({
    data: {
      name,
      code: finalCode,
      categoryId,
      description: description || null,
      sortOrder: 0,
    },
  });

  res.status(201).json({
    message: 'Subcategory created successfully',
    subCategory,
  });
}));

// Update subcategory
router.put('/subcategories/:id', requireTreasurer, [
  body('name').optional().notEmpty().withMessage('Subcategory name cannot be empty'),
  body('description').optional().isString(),
  body('sortOrder').optional().isInt().withMessage('Sort order must be integer'),
  body('isActive').optional().isBoolean().withMessage('Active status must be boolean'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { id } = req.params;
  const updateData = req.body;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!subCategory) {
    throw createError('Subcategory not found', 404);
  }

  const updatedSubCategory = await prisma.subCategory.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: 'Subcategory updated successfully',
    subCategory: updatedSubCategory,
  });
}));

// Delete subcategory
router.delete('/subcategories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if subcategory has transactions
  const transactionCount = await prisma.transaction.count({
    where: { subCategoryId: id },
  });

  if (transactionCount > 0) {
    // Soft delete only
    await prisma.subCategory.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Subcategory deactivated successfully (has associated transactions)',
    });
  } else {
    // Hard delete if no transactions
    await prisma.subCategory.delete({
      where: { id },
    });

    res.json({
      message: 'Subcategory deleted successfully',
    });
  }
}));

export default router; 