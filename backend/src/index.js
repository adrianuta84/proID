const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { UserModel } = require('./models/user');
const { AttributeModel } = require('./models/attribute');
const { auth } = require('./middleware/auth');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = await UserModel.create(req.body);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: 'Error creating user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user || !(await UserModel.verifyPassword(user, password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-super-secret-key-change-in-production');
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: 'Error logging in' });
  }
});

// Attribute routes
app.post('/api/attributes', auth, async (req, res) => {
  try {
    const attribute = await AttributeModel.create({
      ...req.body,
      user_id: req.user.id
    });
    res.status(201).json(attribute);
  } catch (error) {
    res.status(400).json({ error: 'Error creating attribute' });
  }
});

app.get('/api/attributes', auth, async (req, res) => {
  try {
    const attributes = await AttributeModel.findByUserId(req.user.id);
    res.json(attributes);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching attributes' });
  }
});

app.patch('/api/attributes/:id', auth, async (req, res) => {
  try {
    const attribute = await AttributeModel.update(parseInt(req.params.id), req.body);
    res.json(attribute);
  } catch (error) {
    res.status(400).json({ error: 'Error updating attribute' });
  }
});

app.delete('/api/attributes/:id', auth, async (req, res) => {
  try {
    await AttributeModel.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Error deleting attribute' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 