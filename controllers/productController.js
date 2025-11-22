import { Product } from '../models/Product.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllProducts = TryCatch(async (req, res) => {
  const { category_id, search, is_active } = req.query;
  const filters = {};

  if (category_id) filters.category_id = parseInt(category_id);
  if (search) filters.search = search;
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const products = await Product.findAll(filters);
  res.json({ success: true, data: products });
});

export const getProductById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    throw new ErrorHandler(404, 'Product not found');
  }

  // Get stock by warehouse
  const stock = await Product.getStockByWarehouse(id);

  res.json({
    success: true,
    data: {
      ...product,
      stock
    }
  });
});

export const createProduct = TryCatch(async (req, res) => {
  const { name, sku, category_id, unit_of_measure, description, reorder_level, reorder_quantity, initial_stock, warehouse_id } = req.body;

  if (!name || !sku || !unit_of_measure) {
    throw new ErrorHandler(400, 'Name, SKU, and unit of measure are required');
  }

  // Check if SKU exists
  const existingProduct = await Product.findBySku(sku);
  if (existingProduct) {
    throw new ErrorHandler(400, 'Product with this SKU already exists');
  }

  const product = await Product.create({
    name,
    sku,
    category_id: category_id || null,
    unit_of_measure,
    description,
    reorder_level: reorder_level || 0,
    reorder_quantity: reorder_quantity || 0
  });

  // If initial stock is provided, create stock entry
  if (initial_stock && warehouse_id) {
    const { Stock } = await import('../models/Stock.js');
    await Stock.updateStock(
      product.id,
      warehouse_id,
      initial_stock,
      req.user.id,
      'adjustment',
      0,
      'Initial stock'
    );
  }

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

export const updateProduct = TryCatch(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const product = await Product.findById(id);
  if (!product) {
    throw new ErrorHandler(404, 'Product not found');
  }

  // If SKU is being updated, check for duplicates
  if (updates.sku && updates.sku !== product.sku) {
    const existingProduct = await Product.findBySku(updates.sku);
    if (existingProduct) {
      throw new ErrorHandler(400, 'Product with this SKU already exists');
    }
  }

  const updatedProduct = await Product.update(id, updates);
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

export const deleteProduct = TryCatch(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    throw new ErrorHandler(404, 'Product not found');
  }

  // Soft delete by setting is_active to false
  await Product.update(id, { is_active: false });

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

