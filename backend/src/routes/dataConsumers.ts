import express from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: number;
    is_admin: boolean;
  };
}

const router = express.Router();

// Get all data consumers (including user-created ones)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `SELECT dc.*, 
        CASE 
          WHEN dc.is_admin_defined = false THEN 'User Created'
          ELSE 'Admin Defined'
        END as source
      FROM data_consumers dc
      WHERE dc.is_admin_defined = true 
         OR dc.created_by = $1
      ORDER BY dc.name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data consumers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new data consumer
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { name, description, is_private } = req.body;

  try {
    // Check if name already exists
    const existingCheck = await pool.query(
      'SELECT id FROM data_consumers WHERE name = $1',
      [name]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Data consumer with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO data_consumers 
        (name, description, is_admin_defined, is_private, created_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, description, req.user.is_admin, is_private || false, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating data consumer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a data consumer
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { name, description, is_private, is_admin_defined } = req.body;

  try {
    // Check if the data consumer exists and user has permission
    const checkResult = await pool.query(
      `SELECT * FROM data_consumers 
       WHERE id = $1 AND (created_by = $2 OR $3)`,
      [id, req.user.id, req.user.is_admin]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Data consumer not found or no permission' });
    }

    // Check if new name conflicts with existing
    if (name !== checkResult.rows[0].name) {
      const nameCheck = await pool.query(
        'SELECT id FROM data_consumers WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Data consumer with this name already exists' });
      }
    }

    // Only allow admin users to update admin-defined status
    const isAdminDefined = req.user.is_admin ? (is_admin_defined || false) : checkResult.rows[0].is_admin_defined;

    const result = await pool.query(
      `UPDATE data_consumers 
       SET name = $1, description = $2, is_private = $3, is_admin_defined = $4
       WHERE id = $5 
       RETURNING *`,
      [name, description, is_private, isAdminDefined, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating data consumer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a data consumer
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    // Check if the data consumer exists and user has permission
    const checkResult = await pool.query(
      `SELECT * FROM data_consumers 
       WHERE id = $1 AND (created_by = $2 OR is_admin_defined = false)`,
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Data consumer not found or no permission' });
    }

    await pool.query('DELETE FROM data_consumers WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting data consumer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 