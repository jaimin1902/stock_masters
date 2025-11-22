import { Adjustment } from '../models/Adjustment.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllAdjustments = TryCatch(async (req, res) => {
  const { warehouse_id, product_id } = req.query;
  const filters = {};

  if (warehouse_id) filters.warehouse_id = parseInt(warehouse_id);
  if (product_id) filters.product_id = parseInt(product_id);

  const adjustments = await Adjustment.findAll(filters);
  res.json({ success: true, data: adjustments });
});

export const getAdjustmentById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const adjustment = await Adjustment.findById(id);

  if (!adjustment) {
    throw new ErrorHandler(404, 'Adjustment not found');
  }

  res.json({ success: true, data: adjustment });
});

export const createAdjustment = TryCatch(async (req, res) => {
  const { product_id, warehouse_id, physical_quantity, reason } = req.body;
  const io = req.app.get('io');

  if (!product_id || !warehouse_id || physical_quantity === undefined) {
    throw new ErrorHandler(400, 'Product, warehouse, and physical quantity are required');
  }

  const adjustment = await Adjustment.create({
    product_id,
    warehouse_id,
    physical_quantity,
    reason,
    user_id: req.user.id
  });

  // Emit real-time update
  if (io) {
    io.to(`warehouse-${warehouse_id}`).emit('stock-updated', {
      type: 'adjustment',
      adjustment_id: adjustment.id,
      warehouse_id,
      product_id
    });
    io.emit('adjustment-created', { adjustment_id: adjustment.id });
  }

  res.status(201).json({
    success: true,
    message: 'Stock adjustment created successfully',
    data: adjustment
  });
});

