import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const db = new Database('finance.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  created_at: string;
}

export const getTransactions = () => {
  return db.prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC').all() as Transaction[];
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const stmt = db.prepare(`
    INSERT INTO transactions (type, amount, category, date, description)
    VALUES (@type, @amount, @category, @date, @description)
  `);
  return stmt.run(transaction);
};

export const deleteTransaction = (id: number) => {
  return db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
};

export const getSummary = () => {
  const income = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get() as { total: number };
  const expense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get() as { total: number };
  return {
    income: income.total || 0,
    expense: expense.total || 0,
    balance: (income.total || 0) - (expense.total || 0)
  };
};

export default db;
