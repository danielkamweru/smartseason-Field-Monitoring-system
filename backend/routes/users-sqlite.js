const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all field agents (admin only)
router.get('/agents', [
  authenticateToken,
  requireRole(['admin'])
], (req, res) => {
  const db = req.db;
  
  db.all('SELECT id, username, email, created_at FROM users WHERE role = ? ORDER BY username', 
    ['agent'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }
    res.json({ agents: rows });
  });
});

module.exports = router;
