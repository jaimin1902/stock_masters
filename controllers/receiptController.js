import { Receipt } from '../models/Receipt.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllReceipts = TryCatch(async (req, res) => {
  const { warehouse_id, status } = req.query;
  const filters = {};

  if (warehouse_id) filters.warehouse_id = parseInt(warehouse_id);
  if (status) filters.status = status;

  const receipts = await Receipt.findAll(filters);
  res.json({ success: true, data: receipts });
});

export const getReceiptById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const receipt = await Receipt.findById(id);

  if (!receipt) {
    throw new ErrorHandler(404, 'Receipt not found');
  }

  res.json({ success: true, data: receipt });
});

export const createReceipt = TryCatch(async (req, res) => {
  const { warehouse_id, supplier_id, notes, items } = req.body;

  if (!warehouse_id || !items || items.length === 0) {
    throw new ErrorHandler(400, 'Warehouse and items are required');
  }

  const receipt = await Receipt.create({
    warehouse_id,
    supplier_id,
    notes,
    items,
    user_id: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Receipt created successfully',
    data: receipt
  });
});

export const updateReceipt = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { supplier_id, notes, schedule_date, items } = req.body;

  const updates = {};
  if (supplier_id !== undefined) updates.supplier_id = supplier_id;
  if (notes !== undefined) updates.notes = notes;
  if (schedule_date !== undefined) updates.schedule_date = schedule_date;

  const receipt = await Receipt.update(id, updates);

  if (!receipt) {
    throw new ErrorHandler(404, 'Receipt not found');
  }

  // TODO: Handle items update if needed

  res.json({
    success: true,
    message: 'Receipt updated successfully',
    data: receipt
  });
});

export const updateReceiptStatus = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'ready', 'done'].includes(status)) {
    throw new ErrorHandler(400, 'Invalid status');
  }

  const receipt = await Receipt.updateStatus(id, status, req.user.id);

  res.json({
    success: true,
    message: 'Receipt status updated successfully',
    data: receipt
  });
});

export const validateReceipt = TryCatch(async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  const receipt = await Receipt.validate(id, req.user.id);

  // Emit real-time update
  if (io) {
    io.to(`warehouse-${receipt.warehouse_id}`).emit('stock-updated', {
      type: 'receipt',
      receipt_id: receipt.id,
      warehouse_id: receipt.warehouse_id
    });
    io.emit('receipt-validated', { receipt_id: receipt.id });
  }

  res.json({
    success: true,
    message: 'Receipt validated successfully. Stock updated.',
    data: receipt
  });
});

