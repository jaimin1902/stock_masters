-- Locations table (locations within warehouses - rooms, racks, etc.)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, code)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);

