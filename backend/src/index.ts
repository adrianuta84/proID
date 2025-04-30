import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createUser, getUserByEmail, verifyPassword, getUserById, updateUserPassword, getAllUsers, deleteUser, updateUser, getUserByUsername } from './models/user';
import { createAttribute, getUserAttributes, updateAttribute, deleteAttribute, getAttributeById, AttributeInput } from './models/attribute';
import { createDataConsumer, getDataConsumers, searchDataConsumers, updateDataConsumer, deleteDataConsumer } from './models/dataConsumer';
import { authenticateToken, AuthRequest, requireAdmin } from './middleware/auth';
import { pool } from './db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import attributeRoutes from './routes/attributes';
import dataConsumerRoutes from './routes/dataConsumers';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// WebSocket connection handler
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  // Extract token from handshake auth
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('No token provided');
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };
    socket.data.userId = decoded.id;
    console.log('User authenticated:', decoded.id);
  } catch (error) {
    console.error('Invalid token:', error);
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const port = process.env.PORT || 3000;

// Define custom types for multer
declare module 'express-serve-static-core' {
  interface Request {
    file?: Express.Multer.File;
  }
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configure multer file filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  cb(null, true); // Accept all file types for now
};

const upload = multer({ storage, fileFilter });

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(helmet());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/data-consumers', dataConsumerRoutes);

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, name, email, password, is_admin } = req.body;
    console.log('Registration attempt for username:', username);
    
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await createUser({ 
      username,
      name, 
      email, 
      password,
      is_admin: is_admin || false 
    });
    console.log('User created successfully:', user.id);
    
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string);
    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username,
        name: user.name, 
        email: user.email,
        is_admin: user.is_admin 
      } 
    });
  } catch (error: any) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Error creating user', error: error?.message || 'Unknown error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username,
        name: user.name, 
        email: user.email,
        is_admin: user.is_admin 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Add validate endpoint
app.get('/api/auth/validate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username,
        name: user.name, 
        email: user.email,
        is_admin: user.is_admin 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating token' });
  }
});

// User profile routes
app.put('/api/users/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await updateUser(req.user!.id, { name, email });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// User settings routes
app.put('/api/users/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(await verifyPassword(user, currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const updatedUser = await updateUserPassword(userId, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

// Admin routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUser(parseInt(id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const updatedUser = await updateUser(parseInt(id), userData);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Protected routes
app.get('/api/attributes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const attributes = await getUserAttributes(req.user!.id);
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attributes' });
  }
});

app.post('/api/attributes', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { key, value, where_used } = req.body;
    const userId = req.user?.id;

    console.log('Creating attribute with data:', {
      userId,
      key,
      value,
      where_used,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!userId || !key || !value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const attributeInput: AttributeInput = {
      user_id: userId,
      key,
      value,
      where_used: JSON.parse(where_used || '[]')
    };

    if (req.file) {
      attributeInput.file_path = `/uploads/${req.file.filename}`;
      attributeInput.file_name = req.file.originalname;
      attributeInput.file_type = req.file.mimetype.startsWith('image/') ? 'image' as const : 
                                req.file.mimetype.startsWith('application/') ? 'document' as const : 'other' as const;
      attributeInput.file_size = req.file.size;
    }

    console.log('Final attribute input:', attributeInput);

    const attribute = await createAttribute(attributeInput);
    console.log('Created attribute:', attribute);

    res.json(attribute);
  } catch (error: any) {
    console.error('Error creating attribute:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.put('/api/attributes/:id', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { key, value, where_used } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the existing attribute to check ownership and get old file path
    const existingAttribute = await pool.query(
      'SELECT * FROM attributes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingAttribute.rows.length === 0) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    // Delete old file if it exists and a new file is being uploaded
    if (existingAttribute.rows[0].file_path && req.file) {
      const oldFilePath = path.join(__dirname, '..', existingAttribute.rows[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const fileData = req.file ? {
      file_path: `/uploads/${req.file.filename}`,
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size
    } : null;

    const result = await pool.query(
      'UPDATE attributes SET key = $1, value = $2, where_used = $3, file_path = COALESCE($4, file_path), file_name = COALESCE($5, file_name), file_type = COALESCE($6, file_type), file_size = COALESCE($7, file_size) WHERE id = $8 AND user_id = $9 RETURNING *',
      [key, value, JSON.stringify(where_used || []), fileData?.file_path, fileData?.file_name, fileData?.file_type, fileData?.file_size, id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating attribute:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/attributes/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the attribute to check ownership and get file path
    const attribute = await pool.query(
      'SELECT * FROM attributes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (attribute.rows.length === 0) {
      return res.status(404).json({ error: 'Attribute not found' });
    }

    // Delete the file if it exists
    if (attribute.rows[0].file_path) {
      const filePath = path.join(__dirname, '..', attribute.rows[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('DELETE FROM attributes WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Attribute deleted successfully' });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 