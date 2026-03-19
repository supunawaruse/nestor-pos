CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand_id INT REFERENCES brands(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  cost_price DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  barcode VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Plaintext as requested/implied for now
  role VARCHAR(50) NOT NULL DEFAULT 'Employee', -- 'Admin', 'Employee'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  total_amount DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  customer_name VARCHAR(255),
  customer_mobile VARCHAR(50),
  customer_address TEXT,
  notes TEXT,
  sold_by INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Completed', -- 'Completed', 'Exchanged'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_exchanges (
  id SERIAL PRIMARY KEY,
  original_sale_id INT REFERENCES sales(id),
  returned_product_id INT REFERENCES products(id),
  returned_quantity INT NOT NULL,
  new_product_id INT REFERENCES products(id),
  new_quantity INT NOT NULL,
  price_difference DECIMAL(10, 2),
  new_sale_id INT REFERENCES sales(id), -- Tracks the differential payment sale
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
