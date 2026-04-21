const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { updateFieldStatus } = require('../utils/fieldStatus');

const router = express.Router();

// Middleware to attach pool to request
router.use((req, res, next) => {
  req.pool = router.pool;
  next();
});

// Get all fields (admin sees all, agent sees assigned)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = req.pool;
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
        WHERE f.assigned_agent_id = $1 
        ORDER BY f.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ fields: result.rows });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get specific field
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = req.pool;
    const fieldId = req.params.id;

    let query = `
      SELECT f.*, u.username as agent_name 
      FROM fields f 
      LEFT JOIN users u ON f.assigned_agent_id = u.id 
      WHERE f.id = $1
    `;
    let params = [fieldId];

    // If agent, check if field is assigned to them
    if (req.user.role === 'agent') {
      query += ' AND f.assigned_agent_id = $2';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json({ field: result.rows[0] });
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// Create new field (admin only)
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Field name required'),
  body('crop_type').notEmpty().withMessage('Crop type required'),
  body('planting_date').isISO8601().withMessage('Valid planting date required'),
  body('assigned_agent_id').optional().isInt().withMessage('Agent ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, crop_type, planting_date, assigned_agent_id } = req.body;
    const pool = req.pool;

    // Verify agent exists if assigned
    if (assigned_agent_id) {
      const agentResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [assigned_agent_id, 'agent']
      );
      if (agentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }
    }

    // Insert field
    const result = await pool.query(
      'INSERT INTO fields (name, crop_type, planting_date, current_stage, status, assigned_agent_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, crop_type, planting_date, 'planted', 'active', assigned_agent_id]
    );

    // Update status based on planting date
    const field = result.rows[0];
    await updateFieldStatus(pool, field.id);

    // Get updated field with agent name
    const updatedResult = await pool.query(
      'SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = $1',
      [field.id]
    );

    res.status(201).json({
      message: 'Field created successfully',
      field: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// Update field (admin only)
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('name').optional().notEmpty().withMessage('Field name cannot be empty'),
  body('crop_type').optional().notEmpty().withMessage('Crop type cannot be empty'),
  body('planting_date').optional().isISO8601().withMessage('Valid planting date required'),
  body('assigned_agent_id').optional().isInt().withMessage('Agent ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fieldId = req.params.id;
    const { name, crop_type, planting_date, assigned_agent_id } = req.body;
    const pool = req.pool;

    // Check if field exists
    const fieldResult = await pool.query('SELECT id FROM fields WHERE id = $1', [fieldId]);
    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Verify agent exists if assigned
    if (assigned_agent_id) {
      const agentResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [assigned_agent_id, 'agent']
      );
      if (agentResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (crop_type !== undefined) {
      updates.push(`crop_type = $${paramIndex++}`);
      values.push(crop_type);
    }
    if (planting_date !== undefined) {
      updates.push(`planting_date = $${paramIndex++}`);
      values.push(planting_date);
    }
    if (assigned_agent_id !== undefined) {
      updates.push(`assigned_agent_id = $${paramIndex++}`);
      values.push(assigned_agent_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(fieldId);

    const query = `UPDATE fields SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, values);

    // Update status if planting date changed
    if (planting_date !== undefined) {
      await updateFieldStatus(pool, fieldId);
    }

    // Get updated field with agent name
    const updatedResult = await pool.query(
      'SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = $1',
      [fieldId]
    );

    res.json({
      message: 'Field updated successfully',
      field: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Delete field (admin only)
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const fieldId = req.params.id;
    const pool = req.pool;

    // Check if field exists
    const fieldResult = await pool.query('SELECT id FROM fields WHERE id = $1', [fieldId]);
    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Delete field (cascade will delete related updates)
    await pool.query('DELETE FROM fields WHERE id = $1', [fieldId]);

    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

// Update field stage (agent can update assigned fields, admin can update any)
router.put('/:id/stage', [
  authenticateToken,
  body('stage').isIn(['planted', 'growing', 'ready', 'harvested']).withMessage('Invalid stage'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fieldId = req.params.id;
    const { stage, notes } = req.body;
    const pool = req.pool;

    // Check permissions and get field
    let query = 'SELECT * FROM fields WHERE id = $1';
    let params = [fieldId];

    if (req.user.role === 'agent') {
      query += ' AND assigned_agent_id = $2';
      params.push(req.user.id);
    }

    const fieldResult = await pool.query(query, params);

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    const field = fieldResult.rows[0];

    // Update field stage
    await pool.query(
      'UPDATE fields SET current_stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [stage, fieldId]
    );

    // Create field update record
    await pool.query(
      'INSERT INTO field_updates (field_id, agent_id, stage, notes) VALUES ($1, $2, $3, $4)',
      [fieldId, req.user.id, stage, notes || null]
    );

    // Update field status
    await updateFieldStatus(pool, fieldId);

    // Get updated field
    const updatedResult = await pool.query(
      'SELECT f.*, u.username as agent_name FROM fields f LEFT JOIN users u ON f.assigned_agent_id = u.id WHERE f.id = $1',
      [fieldId]
    );

    res.json({
      message: 'Field stage updated successfully',
      field: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Update field stage error:', error);
    res.status(500).json({ error: 'Failed to update field stage' });
  }
});

// Get field updates
router.get('/:id/updates', authenticateToken, async (req, res) => {
  try {
    const fieldId = req.params.id;
    const pool = req.pool;

    // Check permissions
    let query = 'SELECT id FROM fields WHERE id = $1';
    let params = [fieldId];

    if (req.user.role === 'agent') {
      query += ' AND assigned_agent_id = $2';
      params.push(req.user.id);
    }

    const fieldResult = await pool.query(query, params);

    if (fieldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Get updates
    const updatesResult = await pool.query(
      'SELECT fu.*, u.username as agent_name FROM field_updates fu JOIN users u ON fu.agent_id = u.id WHERE fu.field_id = $1 ORDER BY fu.update_date DESC',
      [fieldId]
    );

    res.json({ updates: updatesResult.rows });
  } catch (error) {
    console.error('Get field updates error:', error);
    res.status(500).json({ error: 'Failed to fetch field updates' });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const pool = req.pool;
    let stats;

    if (req.user.role === 'admin') {
      // Admin sees all statistics
      const totalFieldsResult = await pool.query('SELECT COUNT(*) as count FROM fields');
      const statusBreakdownResult = await pool.query('SELECT status, COUNT(*) as count FROM fields GROUP BY status');
      const stageBreakdownResult = await pool.query('SELECT current_stage, COUNT(*) as count FROM fields GROUP BY current_stage');
      const agentStatsResult = await pool.query(`
        SELECT u.id, u.username, COUNT(f.id) as field_count 
        FROM users u 
        LEFT JOIN fields f ON u.id = f.assigned_agent_id 
        WHERE u.role = 'agent' 
        GROUP BY u.id, u.username
      `);

      stats = {
        totalFields: parseInt(totalFieldsResult.rows[0].count),
        statusBreakdown: statusBreakdownResult.rows,
        stageBreakdown: stageBreakdownResult.rows,
        agentStats: agentStatsResult.rows
      };
    } else {
      // Agent sees only their assigned fields
      const totalFieldsResult = await pool.query('SELECT COUNT(*) as count FROM fields WHERE assigned_agent_id = $1', [req.user.id]);
      const statusBreakdownResult = await pool.query('SELECT status, COUNT(*) as count FROM fields WHERE assigned_agent_id = $1 GROUP BY status', [req.user.id]);
      const stageBreakdownResult = await pool.query('SELECT current_stage, COUNT(*) as count FROM fields WHERE assigned_agent_id = $1 GROUP BY current_stage', [req.user.id]);

      stats = {
        totalFields: parseInt(totalFieldsResult.rows[0].count),
        statusBreakdown: statusBreakdownResult.rows,
        stageBreakdown: stageBreakdownResult.rows
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = (pool) => {
  router.pool = pool;
  return router;
};
