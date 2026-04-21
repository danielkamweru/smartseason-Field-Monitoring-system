const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Calculate field status based on planting date and current stage
const calculateFieldStatus = (field) => {
  const plantingDate = new Date(field.planting_date);
  const currentDate = new Date();
  const daysSincePlanting = Math.floor((currentDate - plantingDate) / (1000 * 60 * 60 * 24));
  
  if (field.current_stage === 'harvested') {
    return 'completed';
  }
  
  switch (field.current_stage) {
    case 'planted':
      if (daysSincePlanting > 30) return 'at_risk';
      break;
    case 'growing':
      if (daysSincePlanting > 120) return 'at_risk';
      break;
    case 'ready':
      if (daysSincePlanting > 150) return 'at_risk';
      break;
  }
  
  return 'active';
};

// Get dashboard statistics — must be before /:id
router.get('/stats/dashboard', authenticateToken, (req, res) => {
  const db = req.db;

  if (req.user.role === 'admin') {
    db.get('SELECT COUNT(*) as count FROM fields', (err, totalResult) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch total fields' });

      db.all('SELECT status, COUNT(*) as count FROM fields GROUP BY status', (err, statusRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch status breakdown' });

        db.all('SELECT current_stage, COUNT(*) as count FROM fields GROUP BY current_stage', (err, stageRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch stage breakdown' });

          db.all(`SELECT u.id, u.username, COUNT(f.id) as field_count FROM users u LEFT JOIN fields f ON u.id = f.assigned_agent_id WHERE u.role = 'agent' GROUP BY u.id, u.username`, (err, agentRows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch agent stats' });

            res.json({ stats: { totalFields: totalResult.count, statusBreakdown: statusRows, stageBreakdown: stageRows, agentStats: agentRows } });
          });
        });
      });
    });
  } else {
    db.get('SELECT COUNT(*) as count FROM fields WHERE assigned_agent_id = ?', [req.user.id], (err, totalResult) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch total fields' });

      db.all('SELECT status, COUNT(*) as count FROM fields WHERE assigned_agent_id = ? GROUP BY status', [req.user.id], (err, statusRows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch status breakdown' });

        db.all('SELECT current_stage, COUNT(*) as count FROM fields WHERE assigned_agent_id = ? GROUP BY current_stage', [req.user.id], (err, stageRows) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch stage breakdown' });

          res.json({ stats: { totalFields: totalResult.count, statusBreakdown: statusRows, stageBreakdown: stageRows } });
        });
      });
    });
  }
});

// Get all fields
router.get('/', authenticateToken, (req, res) => {
  const db = req.db;
  let query;
  let params;

  if (req.user.role === 'admin') {
    query = `
      SELECT f.*, u.username as agent_name 
      FROM fields f 
      LEFT JOIN users u ON f.assigned_agent_id = u.id 
      ORDER BY f.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT f.*, u.username as agent_name 
      FROM fields f 
      LEFT JOIN users u ON f.assigned_agent_id = u.id 
      WHERE f.assigned_agent_id = ? 
      ORDER BY f.created_at DESC
    `;
    params = [req.user.id];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch fields' });
    }
    
    // Calculate status for each field
    const fieldsWithStatus = rows.map(field => ({
      ...field,
      status: calculateFieldStatus(field)
    }));
    
    res.json({ fields: fieldsWithStatus });
  });
});

// Get specific field
router.get('/:id', authenticateToken, (req, res) => {
  const db = req.db;
  const fieldId = req.params.id;

  let query = `
    SELECT f.*, u.username as agent_name 
    FROM fields f 
    LEFT JOIN users u ON f.assigned_agent_id = u.id 
    WHERE f.id = ?
  `;
  let params = [fieldId];

  if (req.user.role === 'agent') {
    query += ' AND f.assigned_agent_id = ?';
    params.push(req.user.id);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch field' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const fieldWithStatus = {
      ...row,
      status: calculateFieldStatus(row)
    };

    res.json({ field: fieldWithStatus });
  });
});

// Create new field (admin only)
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Field name required'),
  body('crop_type').notEmpty().withMessage('Crop type required'),
  body('planting_date').isISO8601().withMessage('Valid planting date required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, crop_type, planting_date, assigned_agent_id } = req.body;
  const db = req.db;

  db.run('INSERT INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [name, crop_type, planting_date, 'planted', 'active', assigned_agent_id || null], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create field' });
      }

      // Get the created field with agent name
      db.get('SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = ?', 
        [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to retrieve created field' });
          }

          const fieldWithStatus = {
            ...row,
            status: calculateFieldStatus(row)
          };

          res.status(201).json({
            message: 'Field created successfully',
            field: fieldWithStatus
          });
        }
      );
    }
  );
});

// Update field (admin only)
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('name').optional().notEmpty().withMessage('Field name cannot be empty'),
  body('crop_type').optional().notEmpty().withMessage('Crop type cannot be empty'),
  body('planting_date').optional().isISO8601().withMessage('Valid planting date required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const fieldId = req.params.id;
  const { name, crop_type, planting_date, assigned_agent_id } = req.body;
  const db = req.db;

  db.get('SELECT id FROM fields WHERE id = ?', [fieldId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Field not found' });

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (crop_type !== undefined) { updates.push('crop_type = ?'); values.push(crop_type); }
    if (planting_date !== undefined) { updates.push('planting_date = ?'); values.push(planting_date); }
    if (assigned_agent_id !== undefined) { updates.push('assigned_agent_id = ?'); values.push(assigned_agent_id || null); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(fieldId);

    db.run(`UPDATE fields SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update field' });

      db.get('SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = ?', [fieldId], (err, updatedRow) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve updated field' });

        res.json({ message: 'Field updated successfully', field: { ...updatedRow, status: calculateFieldStatus(updatedRow) } });
      });
    });
  });
});

// Delete field (admin only)
router.delete('/:id', [authenticateToken, requireRole(['admin'])], (req, res) => {
  const fieldId = req.params.id;
  const db = req.db;

  db.get('SELECT id FROM fields WHERE id = ?', [fieldId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Field not found' });

    db.run('DELETE FROM fields WHERE id = ?', [fieldId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete field' });
      res.json({ message: 'Field deleted successfully' });
    });
  });
});

// Update field stage
router.put('/:id/stage', [
  authenticateToken,
  body('stage').isIn(['planted', 'growing', 'ready', 'harvested']).withMessage('Invalid stage'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const fieldId = req.params.id;
  const { stage, notes } = req.body;
  const db = req.db;

  // Check permissions and get field
  let query = 'SELECT * FROM fields WHERE id = ?';
  let params = [fieldId];

  if (req.user.role === 'agent') {
    query += ' AND assigned_agent_id = ?';
    params.push(req.user.id);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Update field stage
    db.run('UPDATE fields SET current_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [stage, fieldId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update field stage' });
        }

        // Create field update record
        db.run('INSERT INTO field_updates (field_id, agent_id, stage, notes) VALUES (?, ?, ?, ?)', 
          [fieldId, req.user.id, stage, notes || null], (err) => {
            if (err) {
              console.error('Failed to create update record:', err);
            }

            // Get updated field
            db.get('SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = ?', 
              [fieldId], (err, updatedRow) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to retrieve updated field' });
                }

                const fieldWithStatus = {
                  ...updatedRow,
                  status: calculateFieldStatus(updatedRow)
                };

                res.json({
                  message: 'Field stage updated successfully',
                  field: fieldWithStatus
                });
              }
            );
          }
        );
      }
    );
  });
});

// Get field updates — must be before /:id catch but after /:id/stage
router.get('/:id/updates', authenticateToken, (req, res) => {
  const fieldId = req.params.id;
  const db = req.db;

  // Check permissions
  let query = 'SELECT id FROM fields WHERE id = ?';
  let params = [fieldId];

  if (req.user.role === 'agent') {
    query += ' AND assigned_agent_id = ?';
    params.push(req.user.id);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Get updates
    db.all('SELECT fu.*, u.username as agent_name FROM field_updates fu JOIN users u ON fu.agent_id = u.id WHERE fu.field_id = ? ORDER BY fu.update_date DESC', 
      [fieldId], (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch field updates' });
        }
        res.json({ updates: rows });
      }
    );
  });
});

module.exports = router;
