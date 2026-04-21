const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Database connection (SQLite)
const db = new sqlite3.Database('./smartseason.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with sample data
function initializeDatabase() {
  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Fields table
    db.run(`CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      planting_date DATE NOT NULL,
      current_stage TEXT NOT NULL CHECK (current_stage IN ('planted', 'growing', 'ready', 'harvested')),
      status TEXT NOT NULL CHECK (status IN ('active', 'at_risk', 'completed')),
      assigned_agent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    )`);

    // Field updates table
    db.run(`CREATE TABLE IF NOT EXISTS field_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      field_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      stage TEXT NOT NULL CHECK (stage IN ('planted', 'growing', 'ready', 'harvested')),
      notes TEXT,
      update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Insert demo data
    const bcrypt = require('bcryptjs');
    const adminPassword = bcrypt.hashSync('password', 10);
    const agentPassword = bcrypt.hashSync('password', 10);

    // Insert users
    db.run('INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
      ['admin', 'admin@smartseason.com', adminPassword, 'admin']);
    
    db.run('INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
      ['agent1', 'agent1@smartseason.com', agentPassword, 'agent']);

    // Insert sample fields
    const today = new Date();
    const plantingDate1 = new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plantingDate2 = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plantingDate3 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plantingDate4 = new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    db.run('INSERT OR IGNORE INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?)', 
      ['North Field', 'Maize', plantingDate1, 'growing', 'active', 2]);
    
    db.run('INSERT OR IGNORE INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?)', 
      ['South Field', 'Wheat', plantingDate2, 'planted', 'active', 2]);
    
    db.run('INSERT OR IGNORE INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?)', 
      ['East Field', 'Tomatoes', plantingDate3, 'ready', 'active', 2]);
    
    db.run('INSERT OR IGNORE INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?)', 
      ['West Field', 'Potatoes', plantingDate4, 'harvested', 'completed', 2]);

    console.log('Database initialized with sample data');
  });
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());

// Database middleware
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Import routes
const authRoutes = require('./routes/auth-sqlite');
const fieldRoutes = require('./routes/fields-sqlite');
const userRoutes = require('./routes/users-sqlite');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
