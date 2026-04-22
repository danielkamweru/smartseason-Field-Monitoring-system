const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const initDatabase = async () => {
  try {
    console.log('Starting database initialization...');
    
    // Test connection
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    // Create tables
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
    console.log('Users table created/verified');

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
    console.log('Fields table created/verified');

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
    console.log('Field updates table created/verified');

    // Check and create demo users
    const adminExists = await client.query('SELECT id FROM users WHERE email = $1', ['admin@smartseason.com']);
    
    if (adminExists.rows.length === 0) {
      console.log('Creating demo users...');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      // Create admin user
      await client.query(`
        INSERT INTO users (username, email, password, role) 
        VALUES ('admin', 'admin@smartseason.com', $1, 'admin')
      `, [hashedPassword]);
      
      // Create agent user
      await client.query(`
        INSERT INTO users (username, email, password, role) 
        VALUES ('agent1', 'agent1@smartseason.com', $1, 'agent')
      `, [hashedPassword]);
      
      console.log('Demo users created successfully');
    } else {
      console.log('Demo users already exist');
    }

    // Create sample fields if none exist
    const fieldsExist = await client.query('SELECT COUNT(*) FROM fields');
    
    if (parseInt(fieldsExist.rows[0].count) === 0) {
      console.log('Creating sample fields...');
      
      const adminId = await client.query('SELECT id FROM users WHERE email = $1', ['admin@smartseason.com']);
      const agentId = await client.query('SELECT id FROM users WHERE email = $1', ['agent1@smartseason.com']);
      
      if (adminId.rows.length > 0 && agentId.rows.length > 0) {
        await client.query(`
          INSERT INTO fields (name, crop_type, planting_date, current_stage, assigned_agent_id) VALUES
          ('North Field', 'Maize', '2024-03-15', 'growing', $1),
          ('South Field', 'Wheat', '2024-04-01', 'planted', $2),
          ('East Field', 'Soybeans', '2024-03-20', 'ready', $1),
          ('West Field', 'Rice', '2024-03-10', 'harvested', $2)
        `, [agentId.rows[0].id, agentId.rows[0].id]);
        
        console.log('Sample fields created successfully');
      }
    } else {
      console.log('Sample fields already exist');
    }

    client.release();
    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
