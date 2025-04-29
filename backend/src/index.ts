import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, verifyPassword, getUserById, updateUserPassword, getAllUsers, deleteUser, updateUser } from './models/user';
import { createAttribute, getUserAttributes, updateAttribute, deleteAttribute, getAttributeById } from './models/attribute';
import { authenticateToken, AuthRequest, requireAdmin } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(helmet());
app.use(express.json());

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, is_admin } = req.body;
    console.log('Registration attempt for email:', email, 'is_admin:', is_admin);
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await createUser({ 
      name, 
      email, 
      password,
      is_admin: is_admin || false 
    });
    console.log('User created successfully:', user.id, 'is_admin:', user.is_admin);
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
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
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        is_admin: user.is_admin 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// User settings routes
app.put('/api/users/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!(await verifyPassword(user, currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const updatedUser = await updateUserPassword(user.id, newPassword);
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

app.post('/api/attributes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { key, value, where_used } = req.body;
    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const attribute = await createAttribute({
      user_id: req.user!.id,
      key,
      value,
      where_used
    });
    res.status(201).json(attribute);
  } catch (error) {
    res.status(500).json({ message: 'Error creating attribute' });
  }
});

app.put('/api/attributes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    // Check if the attribute belongs to the user
    const attribute = await getAttributeById(parseInt(id));
    if (!attribute || attribute.user_id !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized to update this attribute' });
    }
    
    const updatedAttribute = await updateAttribute(parseInt(id), value);
    res.json(updatedAttribute);
  } catch (error) {
    res.status(500).json({ message: 'Error updating attribute' });
  }
});

app.delete('/api/attributes/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Check if the attribute belongs to the user
    const attribute = await getAttributeById(parseInt(id));
    if (!attribute || attribute.user_id !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized to delete this attribute' });
    }
    
    await deleteAttribute(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting attribute' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 