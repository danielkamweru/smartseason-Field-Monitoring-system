const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { dbPool, initializeDatabase } = require('./database');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://smartseason-field-monitoring-system.vercel.app',
        'https://smartseason-field-monitoring-system.vercel.app/'
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());

// Initialize database
initializeDatabase();

// Import routes
const authRoutes = require('./routes/auth')(dbPool);
const fieldRoutes = require('./routes/fields')(dbPool);
const userRoutes = require('./routes/users')(dbPool);

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
