-- Add schedule_date column to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS schedule_date DATE;

