import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, verifyPassword } from './models/user';
import { createAttribute, getUserAttributes, updateAttribute, deleteAttribute } from './models/attribute';
import { authenticateToken } from './middleware/auth';

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
    const { name, email, password } = req.body;
    console.log('Registration attempt for email:', email);
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await createUser({ name, email, password });
    console.log('User created successfully:', user.id);
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Error creating user', error: error?.message || 'Unknown error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Protected routes
app.get('/api/attributes', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/attributes - User:', req.user);
    const attributes = await getUserAttributes(req.user.id);
    console.log('Found attributes:', attributes);
    res.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ message: 'Error fetching attributes' });
  }
});

app.post('/api/attributes', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/attributes - User:', req.user);
    console.log('Request body:', req.body);
    
    const { key, value, where_used } = req.body;
    if (!key || !value) {
      console.log('Missing required fields:', { key, value });
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const attribute = await createAttribute({
      user_id: req.user.id,
      key,
      value,
      where_used
    });
    console.log('Attribute created successfully:', attribute);
    res.status(201).json(attribute);
  } catch (error) {
    console.error('Detailed error creating attribute:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ 
      message: 'Error creating attribute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/attributes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    const attribute = await updateAttribute(parseInt(id), value);
    res.json(attribute);
  } catch (error) {
    res.status(500).json({ message: 'Error updating attribute' });
  }
});

app.delete('/api/attributes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteAttribute(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting attribute' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 