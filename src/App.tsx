import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2, Plus, Mic, Send, Loader2, Wallet, TrendingUp, TrendingDown, Code, Copy, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface Summary {
  income: number;
  expense: number;
  balance: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinanceApp() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  
  // Input States
  const [activeTab, setActiveTab] = useState<'manual' | 'api'>('manual');
  const [manualForm, setManualForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // API Info State
  const [copied, setCopied] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      const [transRes, sumRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/summary')
      ]);
      const transData = await transRes.json();
      const sumData = await sumRes.json();
      setTransactions(transData);
      setSummary(sumData);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.amount || !manualForm.category) return;

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...manualForm,
        amount: parseFloat(manualForm.amount)
      })
    });
    
    setManualForm({
      type: 'expense',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const copyApiInfo = () => {
    const apiInfo = `
POST ${window.location.origin}/api/transactions
Content-Type: application/json

{
  "type": "expense", // or "income"
  "amount": 100.00,
  "category": "餐饮",
  "date": "2024-03-20",
  "description": "午餐"
}`;
    navigator.clipboard.writeText(apiInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Derived Data for Charts
  const categoryData = transactions.reduce((acc: any[], curr) => {
    if (curr.type === 'expense') {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
    }
    return acc;
  }, []);

  const monthlyData = transactions.reduce((acc: any[], curr) => {
    const month = format(parseISO(curr.date), 'MMM', { locale: zhCN });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      if (curr.type === 'income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({ 
        name: month, 
        income: curr.type === 'income' ? curr.amount : 0, 
        expense: curr.type === 'expense' ? curr.amount : 0 
      });
    }
    return acc;
  }, []).reverse().slice(0, 6); // Last 6 months

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <h1 className="text-xl font-semibold tracking-tight">FinanceFlow 记账助手</h1>
          </div>
          <div className="text-sm text-gray-500">
            个人财务管理系统
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard 
            title="总余额" 
            amount={summary.balance} 
            icon={<Wallet className="w-5 h-5 text-indigo-600" />}
            trend={summary.balance >= 0 ? 'positive' : 'negative'}
          />
          <SummaryCard 
            title="总收入" 
            amount={summary.income} 
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            trend="positive"
          />
          <SummaryCard 
            title="总支出" 
            amount={summary.expense} 
            icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
            trend="negative"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Charts) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Charts Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6">财务概览</h2>
              <div className="h-[300px] w-full">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `¥${value}`} />
                      <Tooltip 
                        formatter={(value: number) => [`¥${value}`, undefined]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend formatter={(value) => value === 'income' ? '收入' : '支出'} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="expense" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">最近交易</h2>
                <a 
                  href="/api/export/excel" 
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出 Excel
                </a>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无交易记录</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                          t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.category}</p>
                          <p className="text-xs text-gray-500">{t.description || format(parseISO(t.date), 'yyyy年MM月dd日', { locale: zhCN })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "font-semibold",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'}¥{t.amount.toFixed(2)}
                        </span>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Input) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">记一笔</h2>
              
              {/* Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    activeTab === 'manual' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  手动记账
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                    activeTab === 'api' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Code className="w-4 h-4" />
                  Agent 接口
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'api' ? (
                  <motion.div 
                    key="api-info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-slate-900 text-slate-50 p-4 rounded-xl text-xs font-mono overflow-x-auto relative group">
                      <button 
                        onClick={copyApiInfo}
                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white"
                        title="复制接口信息"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <div className="mb-2 text-slate-400"># OpenClaw 代理接口配置</div>
                      <div className="text-emerald-400">POST /api/transactions</div>
                      <div className="mt-2 text-slate-300">
{`{
  "type": "expense",
  "amount": 100.00,
  "category": "餐饮",
  "date": "2024-03-20",
  "description": "午餐"
}`}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      您可以配置 OpenClaw 或其他 AI Agent 调用此接口来自动记账。
                      <br />
                      支持字段：<code className="bg-gray-100 px-1 rounded">type</code> (income/expense), <code className="bg-gray-100 px-1 rounded">amount</code>, <code className="bg-gray-100 px-1 rounded">category</code>, <code className="bg-gray-100 px-1 rounded">date</code>, <code className="bg-gray-100 px-1 rounded">description</code>
                    </p>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="manual-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleManualSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={manualForm.type}
                        onChange={(e) => setManualForm({...manualForm, type: e.target.value as 'income' | 'expense'})}
                        className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="expense">支出</option>
                        <option value="income">收入</option>
                      </select>
                      <input
                        type="number"
                        placeholder="金额"
                        value={manualForm.amount}
                        onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
                        step="0.01"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="分类 (例如: 餐饮, 交通)"
                      value={manualForm.category}
                      onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="备注 (可选)"
                      value={manualForm.description}
                      onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                      className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                      添加记录
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Category Pie Chart (Mini) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">支出分布</h2>
              <div className="h-[200px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`¥${value}`, undefined]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    暂无支出数据
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.slice(0, 4).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-medium">¥{entry.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, amount, icon, trend }: { title: string, amount: number, icon: React.ReactNode, trend: 'positive' | 'negative' }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className={cn("text-2xl font-bold tracking-tight", 
          trend === 'positive' ? "text-gray-900" : "text-gray-900"
        )}>
          ¥{amount.toFixed(2)}
        </h3>
      </div>
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
