const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'agent']).withMessage('Role must be admin or agent')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    const db = req.db;

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, passwordHash) => {
        if (err) {
          return res.status(500).json({ error: 'Hashing error' });
        }

        // Insert user
        db.run('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', 
          [username, email, passwordHash, role], 
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Registration failed' });
            }

            const user = {
              id: this.lastID,
              username,
              email,
              role
            };

            // Generate JWT token
            const token = jwt.sign(
              user,
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              message: 'User registered successfully',
              token,
              user
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = req.db;

    // Find user
    db.get('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      bcrypt.compare(password, row.password_hash, (err, isValid) => {
        if (err || !isValid) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role
        };

        // Generate JWT token
        const token = jwt.sign(
          user,
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Login successful',
          token,
          user
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: row });
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

module.exports = router;
