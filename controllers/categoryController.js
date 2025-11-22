import { Category } from '../models/Category.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllCategories = TryCatch(async (req, res) => {
  const categories = await Category.findAll();
  res.json({ success: true, data: categories });
});

export const getCategoryById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) {
    throw new ErrorHandler(404, 'Category not found');
  }

  res.json({ success: true, data: category });
});

export const createCategory = TryCatch(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ErrorHandler(400, 'Category name is required');
  }

  const category = await Category.create({ name, description });
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

export const updateCategory = TryCatch(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new ErrorHandler(404, 'Category not found');
  }

  const updatedCategory = await Category.update(id, updates);
  res.json({
    success: true,
    message: 'Category updated successfully',
    data: updatedCategory
  });
});

