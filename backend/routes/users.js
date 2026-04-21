const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware to attach pool to request
router.use((req, res, next) => {
  req.pool = router.pool;
  next();
});

// Get all field agents (admin only)
router.get('/agents', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const pool = req.pool;
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE role = $1 ORDER BY username',
      ['agent']
    );

    res.json({ agents: result.rows });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

module.exports = (pool) => {
  router.pool = pool;
  return router;
};
