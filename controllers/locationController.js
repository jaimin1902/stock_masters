import { Location } from '../models/Location.js';
import { TryCatch } from '../middlewares/error.js';
import ErrorHandler from '../utils/errorHandler.js';

export const getAllLocations = TryCatch(async (req, res) => {
  const { warehouse_id, is_active } = req.query;
  const filters = {};

  if (warehouse_id) filters.warehouse_id = parseInt(warehouse_id);
  if (is_active !== undefined) filters.is_active = is_active === 'true';

  const locations = await Location.findAll(filters);
  res.json({ success: true, data: locations });
});

export const getLocationById = TryCatch(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findById(id);

  if (!location) {
    throw new ErrorHandler(404, 'Location not found');
  }

  res.json({ success: true, data: location });
});

export const createLocation = TryCatch(async (req, res) => {
  const { name, code, warehouse_id, description } = req.body;

  if (!name || !code || !warehouse_id) {
    throw new ErrorHandler(400, 'Name, code, and warehouse are required');
  }

  // Check if location code already exists in this warehouse
  const existing = await Location.findByCode(code, warehouse_id);
  if (existing) {
    throw new ErrorHandler(400, 'Location code already exists in this warehouse');
  }

  const location = await Location.create({
    name,
    code,
    warehouse_id,
    description
  });

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: location
  });
});

export const updateLocation = TryCatch(async (req, res) => {
  const { id } = req.params;
  const { name, code, warehouse_id, description, is_active } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (code !== undefined) updates.code = code;
  if (warehouse_id !== undefined) updates.warehouse_id = warehouse_id;
  if (description !== undefined) updates.description = description;
  if (is_active !== undefined) updates.is_active = is_active;

  // If code is being updated, check for duplicates
  if (code !== undefined && warehouse_id !== undefined) {
    const existing = await Location.findByCode(code, warehouse_id);
    if (existing && existing.id !== parseInt(id)) {
      throw new ErrorHandler(400, 'Location code already exists in this warehouse');
    }
  }

  const location = await Location.update(id, updates);

  if (!location) {
    throw new ErrorHandler(404, 'Location not found');
  }

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: location
  });
});

export const deleteLocation = TryCatch(async (req, res) => {
  const { id } = req.params;
  const location = await Location.delete(id);

  if (!location) {
    throw new ErrorHandler(404, 'Location not found');
  }

  res.json({
    success: true,
    message: 'Location deleted successfully'
  });
});

