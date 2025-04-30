import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  }
});

// Get all attributes for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM attributes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new attribute
router.post('/', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { key, value, where_used } = req.body;
  const file = req.file;

  try {
    const fileData = file ? {
      file_path: '/uploads/' + file.filename,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size
    } : null;

    const result = await pool.query(
      `INSERT INTO attributes 
       (key, value, where_used, user_id, file_path, file_name, file_type, file_size) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        key,
        value,
        JSON.stringify(where_used || []),
        req.user.id,
        fileData?.file_path,
        fileData?.file_name,
        fileData?.file_type,
        fileData?.file_size
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating attribute:', error);
    if (file) {
      fs.unlinkSync(file.path);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update an attribute
router.put('/:id', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { key, value, where_used } = req.body;
  const file = req.file;

  try {
    // Get the existing attribute to check ownership and get old file path
    const existingAttribute = await pool.query(
      'SELECT * FROM attributes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingAttribute.rows.length === 0) {
      if (file) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({ message: 'Attribute not found' });
    }

    const fileData = file ? {
      file_path: '/uploads/' + file.filename,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size
    } : null;

    const result = await pool.query(
      `UPDATE attributes 
       SET key = $1, value = $2, where_used = $3, 
           file_path = COALESCE($4, file_path), 
           file_name = COALESCE($5, file_name), 
           file_type = COALESCE($6, file_type), 
           file_size = COALESCE($7, file_size) 
       WHERE id = $8 AND user_id = $9 
       RETURNING *`,
      [
        key,
        value,
        JSON.stringify(where_used || []),
        fileData?.file_path,
        fileData?.file_name,
        fileData?.file_type,
        fileData?.file_size,
        id,
        req.user.id
      ]
    );

    // If there was an old file and a new file is uploaded, delete the old file
    if (file && existingAttribute.rows[0].file_path) {
      const oldFilePath = path.join(__dirname, '../..', existingAttribute.rows[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating attribute:', error);
    if (file) {
      fs.unlinkSync(file.path);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete an attribute
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    // Get the attribute to check ownership and get file path
    const attribute = await pool.query(
      'SELECT * FROM attributes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (attribute.rows.length === 0) {
      return res.status(404).json({ message: 'Attribute not found' });
    }

    // Delete the file if it exists
    if (attribute.rows[0].file_path) {
      const filePath = path.join(__dirname, '../..', attribute.rows[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('DELETE FROM attributes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Attribute deleted successfully' });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 