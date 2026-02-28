import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { addTransaction, deleteTransaction, getSummary, getTransactions } from "./src/db";
import ExcelJS from 'exceljs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  // AI Agent Endpoint
  app.post("/api/ai/parse", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Parse the following financial transaction text into structured JSON.
        Current date is ${new Date().toISOString().split('T')[0]}.
        If the date is not specified, use today's date.
        Infer the category from the description (e.g., 'Food', 'Transport', 'Salary', 'Utilities', 'Entertainment').
        
        Text: "${text}"
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["income", "expense"] },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              date: { type: Type.STRING, description: "ISO 8601 date string (YYYY-MM-DD)" },
              description: { type: Type.STRING },
              confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
            },
            required: ["type", "amount", "category", "date", "description"]
          }
        }
      });

      const responseText = result.text;
      if (!responseText) {
        throw new Error("No response text");
      }
      res.json(JSON.parse(responseText));

    } catch (error) {
      console.error("AI Parse Error:", error);
      res.status(500).json({ error: "Failed to parse with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
