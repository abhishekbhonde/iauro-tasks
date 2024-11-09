// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { User, Transaction, Loan } = require('./models'); // Import models

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Generate token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User does not exist' });

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's expenses
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await Transaction.find({ userId: req.user.id, type: 'expense' }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    const newExpense = new Transaction({ userId: req.user.id, type: 'expense', category, amount, description });
    await newExpense.save();
    res.json(newExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE endpoint for expenses
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update expense
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    const result = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { category, amount, description },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's loans
app.get('/api/loans', authenticateToken, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new loan
app.post('/api/loans', authenticateToken, async (req, res) => {
  try {
    const { personName, amount, type, description } = req.body;
    const newLoan = new Loan({ userId: req.user.id, personName, amount, type, description });
    await newLoan.save();
    res.json(newLoan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update loan
app.put('/api/loans/:id', authenticateToken, async (req, res) => {
  try {
    const { personName, amount, type, description } = req.body;
    const result = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { personName, amount, type, description },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Loan not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete loan
app.delete('/api/loans/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Loan not found' });
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
