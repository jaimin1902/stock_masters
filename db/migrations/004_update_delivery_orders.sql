-- Add new fields to delivery_orders table
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS schedule_date DATE;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS responsible INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);

-- Update status default to 'draft' and allow new statuses: draft, waiting, ready, done
ALTER TABLE delivery_orders ALTER COLUMN status SET DEFAULT 'draft';

-- Update existing statuses to match new workflow
UPDATE delivery_orders SET status = 'draft' WHERE status = 'pending';
UPDATE delivery_orders SET status = 'ready' WHERE status = 'picked' OR status = 'packed';
UPDATE delivery_orders SET status = 'done' WHERE status = 'validated';

