import express from "express";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { addTransaction, deleteTransaction, getSummary, getTransactions, getDatabaseStats } from "./src/db";
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const logs: { timestamp: string; level: string; message: string }[] = [];
  const addLog = (level: string, message: string) => {
    logs.unshift({ timestamp: new Date().toISOString(), level, message });
    if (logs.length > 50) logs.pop();
  };

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      addLog('info', `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.get("/api/export/excel", async (req, res) => {
    try {
      const transactions = getTransactions();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Transactions');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: '类型', key: 'type', width: 10 },
        { header: '金额', key: 'amount', width: 15 },
        { header: '分类', key: 'category', width: 20 },
        { header: '日期', key: 'date', width: 15 },
        { header: '备注', key: 'description', width: 30 },
        { header: '创建时间', key: 'created_at', width: 20 }
      ];

      transactions.forEach(t => {
        worksheet.addRow({
          id: t.id,
          type: t.type === 'income' ? '收入' : '支出',
          amount: t.amount,
          category: t.category,
          date: t.date,
          description: t.description,
          created_at: t.created_at
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export Error:", error);
      res.status(500).json({ error: "Failed to export Excel" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    try {
      const transactions = getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/summary", (req, res) => {
    try {
      const summary = getSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });
  
  app.get("/api/system-info", (req, res) => {
    try {
      const dbStats = getDatabaseStats();
      const info = {
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAvg: os.loadavg(),
        nodeVersion: process.version,
        dbStats
      };
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system info" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    try {
      const { type, amount, category, date, description } = req.body;
      if (!type || !amount || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      addTransaction({ type, amount, category: category || 'Uncategorized', date, description: description || '' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add transaction" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    try {
      const { id } = req.params;
      deleteTransaction(Number(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    
    // SPA fallback
    app.get("*", (req, res, next) => {
      if (req.url.startsWith("/api")) return next();
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    addLog('info', `Server started on port ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
