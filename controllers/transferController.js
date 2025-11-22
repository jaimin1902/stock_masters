import { Transfer } from '../models/Transfer.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllTransfers = TryCatch(async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, status } = req.query;
  const filters = {};

  if (from_warehouse_id) filters.from_warehouse_id = parseInt(from_warehouse_id);
  if (to_warehouse_id) filters.to_warehouse_id = parseInt(to_warehouse_id);
  if (status) filters.status = status;

  const transfers = await Transfer.findAll(filters);
  res.json({ success: true, data: transfers });
});

export const getTransferById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const transfer = await Transfer.findById(id);

  if (!transfer) {
    throw new ErrorHandler(404, 'Transfer not found');
  }

  res.json({ success: true, data: transfer });
});

export const createTransfer = TryCatch(async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, notes, items } = req.body;

  if (!from_warehouse_id || !to_warehouse_id || !items || items.length === 0) {
    throw new ErrorHandler(400, 'From warehouse, to warehouse, and items are required');
  }

  if (from_warehouse_id === to_warehouse_id) {
    throw new ErrorHandler(400, 'From and to warehouses cannot be the same');
  }

  const transfer = await Transfer.create({
    from_warehouse_id,
    to_warehouse_id,
    notes,
    items
  });

  res.status(201).json({
    success: true,
    message: 'Transfer created successfully',
    data: transfer
  });
});

export const validateTransfer = TryCatch(async (req, res) => {
  const { id } = req.params;
  const io = req.app.get('io');

  const transfer = await Transfer.validate(id, req.user.id);

  // Emit real-time update
  if (io) {
    io.to(`warehouse-${transfer.from_warehouse_id}`).emit('stock-updated', {
      type: 'transfer_out',
      transfer_id: transfer.id,
      warehouse_id: transfer.from_warehouse_id
    });
    io.to(`warehouse-${transfer.to_warehouse_id}`).emit('stock-updated', {
      type: 'transfer_in',
      transfer_id: transfer.id,
      warehouse_id: transfer.to_warehouse_id
    });
    io.emit('transfer-validated', { transfer_id: transfer.id });
  }

  res.json({
    success: true,
    message: 'Transfer validated successfully. Stock updated.',
    data: transfer
  });
});

