CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

-- Administrators intentionally use a separate table and token flow; no public role system.
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  meta_title VARCHAR(255) NULL,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  brand VARCHAR(150) NULL,
  type VARCHAR(150) NULL,
  gender ENUM('Men', 'Women', 'Kids', 'Unisex') NULL,
  collection VARCHAR(150) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_filters (status, brand, type, gender, collection)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NULL,
  brand VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(150) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  size JSON NOT NULL,
  product_type ENUM('Ready Stock', 'Pre Order') NOT NULL DEFAULT 'Ready Stock',
  delivery_time VARCHAR(100) NULL,
  availability VARCHAR(100) NOT NULL DEFAULT 'Available',
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  images JSON NOT NULL,
  image_alt_text VARCHAR(255) NULL,
  variations JSON NULL,
  product_tag VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_brand (brand),
  KEY idx_products_category (category),
  KEY idx_products_type (product_type),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  order_notes TEXT NULL,
  order_number VARCHAR(40) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'Payment Pending',
  order_status VARCHAR(80) NOT NULL DEFAULT 'Order Placed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_email (email),
  KEY idx_orders_status (order_status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(255) NOT NULL,
  selected_size VARCHAR(50) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(80) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status_history_order (order_id),
  CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
