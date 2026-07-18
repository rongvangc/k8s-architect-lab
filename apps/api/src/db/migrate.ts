import type pg from "pg";

export async function runMigrations(pool: pg.Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      address VARCHAR(500) NOT NULL,
      rating NUMERIC(2,1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      image_url VARCHAR(500),
      category VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      customer_name VARCHAR(255) NOT NULL,
      delivery_address TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      total_amount NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
