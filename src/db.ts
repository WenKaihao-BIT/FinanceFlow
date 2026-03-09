import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'finance.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ transactions: [] }, null, 2));
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  created_at: string;
}

interface DBData {
  transactions: Transaction[];
}

// Helper to read DB
const readDB = (): DBData => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { transactions: [] };
  }
};

// Helper to write DB
const writeDB = (data: DBData) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export const getTransactions = () => {
  const db = readDB();
  // Sort by date desc, then created_at desc
  return db.transactions.sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export const addTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const db = readDB();
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now(), // Simple ID generation
    created_at: new Date().toISOString()
  };
  db.transactions.push(newTransaction);
  writeDB(db);
  return { changes: 1 };
};

export const deleteTransaction = (id: number) => {
  const db = readDB();
  const initialLength = db.transactions.length;
  db.transactions = db.transactions.filter(t => t.id !== id);
  writeDB(db);
  return { changes: initialLength - db.transactions.length };
};

export const getSummary = () => {
  const db = readDB();
  const income = db.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = db.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    income,
    expense,
    balance: income - expense
  };
};

export const getDatabaseStats = () => {
  const stats = fs.statSync(DB_FILE);
  const db = readDB();
  return {
    fileSize: stats.size,
    recordCount: db.transactions.length,
    lastModified: stats.mtime.toISOString(),
    path: DB_FILE
  };
};

export default {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getSummary,
  getDatabaseStats
};
