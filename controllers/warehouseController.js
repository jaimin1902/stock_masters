import { Warehouse } from '../models/Warehouse.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllWarehouses = TryCatch(async (req, res) => {
  const { is_active } = req.query;
  const filters = {};

  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const warehouses = await Warehouse.findAll(filters);
  res.json({ success: true, data: warehouses });
});

export const getWarehouseById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const warehouse = await Warehouse.findById(id);

  if (!warehouse) {
    throw new ErrorHandler(404, 'Warehouse not found');
  }

  res.json({ success: true, data: warehouse });
});

export const createWarehouse = TryCatch(async (req, res) => {
  const { name, code, address } = req.body;

  if (!name || !code) {
    throw new ErrorHandler(400, 'Warehouse name and code are required');
  }

  // Check if code exists
  const existingWarehouse = await Warehouse.findByCode(code);
  if (existingWarehouse) {
    throw new ErrorHandler(400, 'Warehouse with this code already exists');
  }

  const warehouse = await Warehouse.create({ name, code, address });
  res.status(201).json({
    success: true,
    message: 'Warehouse created successfully',
    data: warehouse
  });
});

export const updateWarehouse = TryCatch(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const warehouse = await Warehouse.findById(id);
  if (!warehouse) {
    throw new ErrorHandler(404, 'Warehouse not found');
  }

  // If code is being updated, check for duplicates
  if (updates.code && updates.code !== warehouse.code) {
    const existingWarehouse = await Warehouse.findByCode(updates.code);
    if (existingWarehouse) {
      throw new ErrorHandler(400, 'Warehouse with this code already exists');
    }
  }

  const updatedWarehouse = await Warehouse.update(id, updates);
  res.json({
    success: true,
    message: 'Warehouse updated successfully',
    data: updatedWarehouse
  });
});

