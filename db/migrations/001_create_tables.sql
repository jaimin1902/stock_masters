-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'stock_master',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES product_categories(id) ON DELETE SET NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    description TEXT,
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock table (stock per warehouse)
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table (Incoming Stock)
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, validated, cancelled
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    received_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipt Items table
CREATE TABLE IF NOT EXISTS receipt_items (
    id SERIAL PRIMARY KEY,
    receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Orders table (Outgoing Stock)
CREATE TABLE IF NOT EXISTS delivery_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    customer_name VARCHAR(255),
    customer_address TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, picked, packed, validated, cancelled
    picked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    packed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    picked_at TIMESTAMP,
    packed_at TIMESTAMP,
    validated_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Order Items table
CREATE TABLE IF NOT EXISTS delivery_order_items (
    id SERIAL PRIMARY KEY,
    delivery_order_id INTEGER REFERENCES delivery_orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Internal Transfers table
CREATE TABLE IF NOT EXISTS internal_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(100) UNIQUE NOT NULL,
    from_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    to_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, validated, cancelled
    transferred_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transferred_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (from_warehouse_id != to_warehouse_id)
);

-- Transfer Items table
CREATE TABLE IF NOT EXISTS transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES internal_transfers(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    adjustment_number VARCHAR(100) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    recorded_quantity INTEGER NOT NULL,
    physical_quantity INTEGER NOT NULL,
    adjustment_quantity INTEGER GENERATED ALWAYS AS (physical_quantity - recorded_quantity) STORED,
    reason TEXT,
    adjusted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    adjusted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Move History / Stock Ledger table
CREATE TABLE IF NOT EXISTS move_history (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- receipt, delivery, transfer_out, transfer_in, adjustment
    reference_id INTEGER NOT NULL, -- ID of receipt, delivery_order, transfer, or adjustment
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    quantity_change INTEGER NOT NULL, -- positive for increase, negative for decrease
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_product_warehouse ON stock(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_receipts_warehouse ON receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_warehouse ON delivery_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_move_history_product ON move_history(product_id);
CREATE INDEX IF NOT EXISTS idx_move_history_warehouse ON move_history(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_move_history_type ON move_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_move_history_created ON move_history(created_at DESC);

