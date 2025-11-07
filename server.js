const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for transactions (in production, use a database)
let transactions = [];

// Routes
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const transaction = req.body;
  transaction.id = Date.now().toString(); // Simple ID generation
  transactions.push(transaction);
  res.status(201).json(transaction);
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const updatedTransaction = req.body;
  const index = transactions.findIndex(t => t.id === id);

  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updatedTransaction };
    res.json(transactions[index]);
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const index = transactions.findIndex(t => t.id === id);

  if (index !== -1) {
    transactions.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// New endpoints for terminal integration
app.get('/api/balance', (req, res) => {
  let balance = 0;
  transactions.forEach(t => {
    if (t.type === 'income') balance += t.amount;
    else balance -= t.amount;
  });
  res.json({ balance, currency: 'USD' }); // Default currency, can be made dynamic
});

app.get('/api/summary', (req, res) => {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  res.json({
    totalIncome,
    totalExpense,
    balance,
    transactionCount: transactions.length,
    currency: 'USD'
  });
});

app.get('/api/transactions/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const recentTransactions = transactions.slice(-limit);
  res.json(recentTransactions);
});

// Email invite endpoint (placeholder - in production, integrate with email service)
app.post('/api/invite', (req, res) => {
  const { email } = req.body;
  // Here you would integrate with an email service like SendGrid, Mailgun, etc.
  console.log(`Invite sent to: ${email}`);
  res.json({ message: 'Invite sent successfully' });
});

app.listen(PORT, () => {
  console.log(`Finance Tracker server running on http://localhost:${PORT}`);
});
