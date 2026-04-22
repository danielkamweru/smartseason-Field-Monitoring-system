const { Pool } = require('pg');

// Database configuration for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Alternative configuration for manual setup
const fallbackPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smartseason_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Use the appropriate pool
const dbPool = process.env.DATABASE_URL ? pool : fallbackPool;

// Test connection and initialize tables
const initializeDatabase = async () => {
  try {
    const client = await dbPool.connect();
    console.log('Database connected successfully');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'agent')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        crop_type VARCHAR(50) NOT NULL,
        planting_date DATE NOT NULL,
        current_stage VARCHAR(20) CHECK (current_stage IN ('planted', 'growing', 'ready', 'harvested')) DEFAULT 'planted',
        status VARCHAR(20) CHECK (status IN ('active', 'at_risk', 'completed')) DEFAULT 'active',
        assigned_agent_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS field_updates (
        id SERIAL PRIMARY KEY,
        field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
        agent_id INTEGER REFERENCES users(id),
        stage VARCHAR(20) CHECK (stage IN ('planted', 'growing', 'ready', 'harvested')) NOT NULL,
        notes TEXT,
        update_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if demo users exist, if not create them
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@smartseason.com']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      await client.query(`
        INSERT INTO users (username, email, password, role) VALUES 
        ('admin', 'admin@smartseason.com', $1, 'admin'),
        ('agent1', 'agent1@smartseason.com', $1, 'agent')
      `, [hashedPassword]);
      
      console.log('Demo users created successfully');
    }

    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { dbPool, initializeDatabase };
