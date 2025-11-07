#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Data file path
const DATA_FILE = path.join(__dirname, 'transactions.json');

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Load transactions from file
function loadTransactions() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading transactions:', error.message);
    return [];
  }
}

// Save transactions to file
function saveTransactions(transactions) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2));
    console.log('Transactions saved successfully.');
  } catch (error) {
    console.error('Error saving transactions:', error.message);
  }
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
  const symbols = { USD: '$', EUR: '€', INR: '₹' };
  return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
}

// Calculate balance
function calculateBalance(transactions) {
  return transactions.reduce((balance, transaction) => {
    return transaction.type === 'income' ? balance + transaction.amount : balance - transaction.amount;
  }, 0);
}

// Display menu
function displayMenu() {
  console.log('\n=== Finance Tracker CLI ===');
  console.log('1. View all transactions');
  console.log('2. Add income');
  console.log('3. Add expense');
  console.log('4. View balance');
  console.log('5. Search transactions');
  console.log('6. Delete transaction');
  console.log('7. Export to CSV');
  console.log('8. Exit');
  console.log('==========================');
}

// View all transactions
function viewTransactions() {
  const transactions = loadTransactions();
  if (transactions.length === 0) {
    console.log('No transactions found.');
    return;
  }

  console.log('\nAll Transactions:');
  console.log('ID'.padEnd(5), 'Date'.padEnd(12), 'Description'.padEnd(20), 'Amount'.padEnd(10), 'Type');
  console.log('-'.repeat(60));

  transactions.forEach((transaction, index) => {
    const date = new Date(transaction.primeId).toLocaleDateString();
    const amount = formatCurrency(transaction.amount);
    console.log(
      String(index + 1).padEnd(5),
      date.padEnd(12),
      transaction.description.substring(0, 18).padEnd(20),
      amount.padEnd(10),
      transaction.type
    );
  });

  const balance = calculateBalance(transactions);
  console.log(`\nCurrent Balance: ${formatCurrency(balance)}`);
}

// Add transaction
function addTransaction(type) {
  rl.question(`Enter ${type} description: `, (description) => {
    rl.question(`Enter ${type} amount: `, (amountStr) => {
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        console.log('Invalid amount. Please enter a positive number.');
        return mainMenu();
      }

      const transactions = loadTransactions();
      const transaction = {
        primeId: Date.now(),
        description: description.trim(),
        amount: amount,
        type: type
      };

      transactions.push(transaction);
      saveTransactions(transactions);
      console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
      mainMenu();
    });
  });
}

// View balance
function viewBalance() {
  const transactions = loadTransactions();
  const balance = calculateBalance(transactions);
  console.log(`\nCurrent Balance: ${formatCurrency(balance)}`);

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  console.log(`Total Income: ${formatCurrency(income)}`);
  console.log(`Total Expenses: ${formatCurrency(expenses)}`);
}

// Search transactions
function searchTransactions() {
  rl.question('Enter search term: ', (query) => {
    const transactions = loadTransactions();
    const results = transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
      console.log('No transactions found matching your search.');
    } else {
      console.log(`\nFound ${results.length} transaction(s):`);
      results.forEach((transaction, index) => {
        const date = new Date(transaction.primeId).toLocaleDateString();
        const amount = formatCurrency(transaction.amount);
        console.log(`${index + 1}. ${date} - ${transaction.description} - ${amount} (${transaction.type})`);
      });
    }
    mainMenu();
  });
}

// Delete transaction
function deleteTransaction() {
  viewTransactions();
  rl.question('\nEnter transaction ID to delete (or 0 to cancel): ', (idStr) => {
    const id = parseInt(idStr);
    if (id === 0) return mainMenu();

    const transactions = loadTransactions();
    if (id < 1 || id > transactions.length) {
      console.log('Invalid transaction ID.');
      return mainMenu();
    }

    const deleted = transactions.splice(id - 1, 1)[0];
    saveTransactions(transactions);
    console.log(`Transaction "${deleted.description}" deleted successfully.`);
    mainMenu();
  });
}

// Export to CSV
function exportToCSV() {
  const transactions = loadTransactions();
  if (transactions.length === 0) {
    console.log('No transactions to export.');
    return mainMenu();
  }

  const csvContent = 'Date,Description,Amount,Type\n' +
    transactions.map(t =>
      `${new Date(t.primeId).toLocaleDateString()},"${t.description}",${t.amount},${t.type}`
    ).join('\n');

  const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  fs.writeFileSync(filename, csvContent);
  console.log(`Transactions exported to ${filename}`);
  mainMenu();
}

// Main menu
function mainMenu() {
  displayMenu();
  rl.question('Choose an option (1-8): ', (choice) => {
    switch (choice) {
      case '1':
        viewTransactions();
        mainMenu();
        break;
      case '2':
        addTransaction('income');
        break;
      case '3':
        addTransaction('expense');
        break;
      case '4':
        viewBalance();
        mainMenu();
        break;
      case '5':
        searchTransactions();
        break;
      case '6':
        deleteTransaction();
        break;
      case '7':
        exportToCSV();
        break;
      case '8':
        console.log('Goodbye!');
        rl.close();
        break;
      default:
        console.log('Invalid choice. Please try again.');
        mainMenu();
    }
  });
}

// Start the CLI
console.log('Welcome to Finance Tracker CLI!');
mainMenu();
