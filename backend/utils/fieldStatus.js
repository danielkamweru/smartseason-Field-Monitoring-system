// Field status calculation logic
const calculateFieldStatus = (field) => {
  const plantingDate = new Date(field.planting_date);
  const currentDate = new Date();
  const daysSincePlanting = Math.floor((currentDate - plantingDate) / (1000 * 60 * 60 * 24));
  
  // If already harvested, it's completed
  if (field.current_stage === 'harvested') {
    return 'completed';
  }
  
  // Check if field is at risk based on stage and time elapsed
  switch (field.current_stage) {
    case 'planted':
      // Should be growing within 30 days
      if (daysSincePlanting > 30) {
        return 'at_risk';
      }
      break;
      
    case 'growing':
      // Should be ready within 120 days of planting
      if (daysSincePlanting > 120) {
        return 'at_risk';
      }
      break;
      
    case 'ready':
      // Should be harvested within 150 days of planting
      if (daysSincePlanting > 150) {
        return 'at_risk';
      }
      break;
  }
  
  // If not at risk and not completed, it's active
  return 'active';
};

// Update field status in database
const updateFieldStatus = async (pool, fieldId) => {
  try {
    // Get field data
    const fieldResult = await pool.query(
      'SELECT * FROM fields WHERE id = $1',
      [fieldId]
    );
    
    if (fieldResult.rows.length === 0) {
      throw new Error('Field not found');
    }
    
    const field = fieldResult.rows[0];
    const newStatus = calculateFieldStatus(field);
    
    // Update status if it has changed
    if (field.status !== newStatus) {
      await pool.query(
        'UPDATE fields SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatus, fieldId]
      );
    }
    
    return newStatus;
  } catch (error) {
    throw error;
  }
};

// Update all field statuses (useful for scheduled tasks)
const updateAllFieldStatuses = async (pool) => {
  try {
    const fieldsResult = await pool.query('SELECT * FROM fields');
    const updates = [];
    
    for (const field of fieldsResult.rows) {
      const newStatus = calculateFieldStatus(field);
      if (field.status !== newStatus) {
        await pool.query(
          'UPDATE fields SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, field.id]
        );
        updates.push({ fieldId: field.id, oldStatus: field.status, newStatus });
      }
    }
    
    return updates;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  calculateFieldStatus,
  updateFieldStatus,
  updateAllFieldStatuses
};
