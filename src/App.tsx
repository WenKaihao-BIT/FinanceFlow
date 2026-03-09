import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Trash2, Plus, Wallet, TrendingUp, TrendingDown, Download,
  Utensils, Car, ShoppingBag, Gamepad2, Home, Stethoscope, 
  GraduationCap, Gift, MoreHorizontal, Banknote, Trophy, Briefcase,
  Calendar, Sun, Moon, Server, Activity, Database, Cpu, HardDrive, Clock, List, Settings, Shield, RefreshCw
} from 'lucide-react';
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
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
      {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
    </text>
  );
};

export default function FinanceApp() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounting' | 'server'>('accounting');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [serverSubTab, setServerSubTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  
  // Input States
  const [manualForm, setManualForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    customCategory: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Categories
  const CATEGORIES = {
    expense: ['餐饮', '交通', '购物', '娱乐', '居家', '医疗', '教育', '人情', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '其他']
  };

  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    '餐饮': <Utensils className="w-5 h-5" />,
    '交通': <Car className="w-5 h-5" />,
    '购物': <ShoppingBag className="w-5 h-5" />,
    '娱乐': <Gamepad2 className="w-5 h-5" />,
    '居家': <Home className="w-5 h-5" />,
    '医疗': <Stethoscope className="w-5 h-5" />,
    '教育': <GraduationCap className="w-5 h-5" />,
    '人情': <Gift className="w-5 h-5" />,
    '其他': <MoreHorizontal className="w-5 h-5" />,
    '工资': <Banknote className="w-5 h-5" />,
    '奖金': <Trophy className="w-5 h-5" />,
    '投资': <TrendingUp className="w-5 h-5" />,
    '兼职': <Briefcase className="w-5 h-5" />,
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      const [transRes, sumRes, sysRes, logsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/summary'),
        fetch('/api/system-info'),
        fetch('/api/logs')
      ]);
      const transData = await transRes.json();
      const sumData = await sumRes.json();
      const sysData = await sysRes.json();
      const logsData = await logsRes.json();
      setTransactions(transData);
      setSummary(sumData);
      setSystemInfo(sysData);
      setLogs(logsData);
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
    const finalCategory = manualForm.category === '其他' ? manualForm.customCategory : manualForm.category;
    if (!manualForm.amount || !finalCategory) return;

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...manualForm,
        category: finalCategory,
        amount: parseFloat(manualForm.amount)
      })
    });
    
    setManualForm({
      type: 'expense',
      amount: '',
      category: '',
      customCategory: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
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
    <div className={cn(
      "min-h-screen transition-colors duration-300 pb-20",
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-10 border-b transition-colors duration-300",
        isDarkMode ? "bg-slate-900/80 backdrop-blur-md border-slate-800" : "bg-white border-gray-200"
      )}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <h1 className="text-xl font-semibold tracking-tight">凯浩大人记账助手</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
              <button
                onClick={() => setActiveTab('accounting')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'accounting' 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                账单管理
              </button>
              <button
                onClick={() => setActiveTab('server')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'server' 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                服务器状态
              </button>
            </nav>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isDarkMode ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block text-sm text-gray-500 dark:text-slate-400">
              个人财务管理系统
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {activeTab === 'accounting' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard 
                title="总余额" 
                amount={summary.balance} 
                icon={<Wallet className="w-5 h-5 text-indigo-600" />}
                trend={summary.balance >= 0 ? 'positive' : 'negative'}
                isDarkMode={isDarkMode}
              />
              <SummaryCard 
                title="总收入" 
                amount={summary.income} 
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                trend="positive"
                isDarkMode={isDarkMode}
              />
              <SummaryCard 
                title="总支出" 
                amount={summary.expense} 
                icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
                trend="negative"
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area (Charts) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Charts Section */}
                <div className={cn(
                  "p-6 rounded-2xl shadow-sm border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                  <h2 className="text-lg font-semibold mb-6">财务概览</h2>
                  <div className="h-[300px] w-full">
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ left: 10, right: 10 }}>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `¥${Number(value).toFixed(2)}`}
                            width={80}
                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`¥${value.toFixed(2)}`, undefined]}
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                              color: isDarkMode ? '#f1f5f9' : '#0f172a'
                            }}
                            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                          />
                          <Legend 
                            formatter={(value) => (
                              <span style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                                {value === 'income' ? '收入' : '支出'}
                              </span>
                            )} 
                          />
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
                <div className={cn(
                  "p-6 rounded-2xl shadow-sm border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">最近交易</h2>
                    <a 
                      href="/api/export/excel" 
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                        isDarkMode ? "text-indigo-400 hover:bg-slate-800" : "text-indigo-600 hover:bg-indigo-50"
                      )}
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
                        <div key={t.id} className={cn(
                          "flex items-center justify-between p-3 rounded-xl transition-colors group",
                          isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-50"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600",
                              isDarkMode && (t.type === 'income' ? "bg-emerald-900/30 text-emerald-400" : "bg-rose-900/30 text-rose-400")
                            )}>
                              {CATEGORY_ICONS[t.category] || (t.type === 'income' ? <Plus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={cn("font-medium", isDarkMode ? "text-slate-100" : "text-gray-900")}>{t.category}</p>
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1",
                                  isDarkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"
                                )}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  {format(parseISO(t.date), 'M月d日', { locale: zhCN })}
                                </span>
                              </div>
                              <p className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-gray-500")}>{t.description || '无备注'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "font-semibold",
                              t.type === 'income' ? "text-emerald-600" : "text-rose-600",
                              isDarkMode && (t.type === 'income' ? "text-emerald-400" : "text-rose-400")
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
              <div className="space-y-6 lg:sticky lg:top-24 h-fit">
                <div className={cn(
                  "p-6 rounded-2xl shadow-sm border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                  <h2 className="text-lg font-semibold mb-4">记一笔</h2>
                  
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={manualForm.type}
                        onChange={(e) => setManualForm({...manualForm, type: e.target.value as 'income' | 'expense'})}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900"
                        )}
                      >
                        <option value="expense">支出</option>
                        <option value="income">收入</option>
                      </select>
                      <input
                        type="number"
                        placeholder="金额"
                        value={manualForm.amount}
                        onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-gray-200 text-gray-900"
                        )}
                        step="0.01"
                        required
                      />
                    </div>
                    <select
                      value={manualForm.category}
                      onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
                      className={cn(
                        "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900"
                      )}
                      required
                    >
                      <option value="" disabled>选择分类</option>
                      {CATEGORIES[manualForm.type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {manualForm.category === '其他' && (
                      <motion.input
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        type="text"
                        placeholder="请输入自定义分类"
                        value={manualForm.customCategory}
                        onChange={(e) => setManualForm({...manualForm, customCategory: e.target.value})}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-gray-200 text-gray-900"
                        )}
                        required
                      />
                    )}
                    <input
                      type="date"
                      value={manualForm.date}
                      onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                      className={cn(
                        "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900"
                      )}
                      required
                    />
                    <input
                      type="text"
                      placeholder="备注 (可选)"
                      value={manualForm.description}
                      onChange={(e) => setManualForm({...manualForm, description: e.target.value})}
                      className={cn(
                        "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                        isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-gray-200 text-gray-900"
                      )}
                    />
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      添加记录
                    </button>
                  </form>
                </div>

                {/* Category Pie Chart (Mini) */}
                <div className={cn(
                  "p-6 rounded-2xl shadow-sm border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
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
                            label={renderCustomizedLabel}
                            labelLine={false}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string) => [`¥${value.toFixed(2)}`, name]}
                            contentStyle={{ 
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                              color: isDarkMode ? '#f1f5f9' : '#0f172a'
                            }}
                            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                          />
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
                          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>{entry.name}</span>
                        </div>
                        <span className={cn("font-medium", isDarkMode ? "text-slate-200" : "text-gray-900")}>¥{entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Server Sub-navigation */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
              <button 
                onClick={() => setServerSubTab('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  serverSubTab === 'dashboard' 
                    ? "bg-indigo-600 text-white" 
                    : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Activity className="w-4 h-4" />
                仪表盘
              </button>
              <button 
                onClick={() => setServerSubTab('logs')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  serverSubTab === 'logs' 
                    ? "bg-indigo-600 text-white" 
                    : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <List className="w-4 h-4" />
                系统日志
              </button>
              <button 
                onClick={() => setServerSubTab('settings')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  serverSubTab === 'settings' 
                    ? "bg-indigo-600 text-white" 
                    : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                <Settings className="w-4 h-4" />
                服务器设置
              </button>
            </div>

            {serverSubTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatusCard 
                    title="服务器状态" 
                    value="运行中" 
                    icon={<Activity className="w-5 h-5 text-emerald-500" />} 
                    isDarkMode={isDarkMode}
                  />
                  <StatusCard 
                    title="运行时间" 
                    value={systemInfo ? `${Math.floor(systemInfo.uptime / 3600)}小时 ${Math.floor((systemInfo.uptime % 3600) / 60)}分` : '加载中...'} 
                    icon={<Clock className="w-5 h-5 text-indigo-500" />} 
                    isDarkMode={isDarkMode}
                  />
                  <StatusCard 
                    title="CPU 核心" 
                    value={systemInfo ? `${systemInfo.cpus} 核` : '加载中...'} 
                    icon={<Cpu className="w-5 h-5 text-amber-500" />} 
                    isDarkMode={isDarkMode}
                  />
                  <StatusCard 
                    title="内存使用" 
                    value={systemInfo ? `${((1 - systemInfo.freeMemory / systemInfo.totalMemory) * 100).toFixed(1)}%` : '加载中...'} 
                    icon={<HardDrive className="w-5 h-5 text-rose-500" />} 
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={cn(
                    "p-6 rounded-2xl border transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                  )}>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-500" />
                      数据库信息
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">数据库文件</span>
                        <span className="font-mono text-sm">{systemInfo?.dbStats?.path.split('/').pop()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">记录总数</span>
                        <span className="font-semibold">{systemInfo?.dbStats?.recordCount} 条</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">文件大小</span>
                        <span className="font-semibold">{(systemInfo?.dbStats?.fileSize / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500 dark:text-slate-400">最后更新</span>
                        <span className="text-sm">{systemInfo?.dbStats?.lastModified ? format(parseISO(systemInfo.dbStats.lastModified), 'yyyy-MM-dd HH:mm:ss') : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-6 rounded-2xl border transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                  )}>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Server className="w-5 h-5 text-indigo-500" />
                      环境信息
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">操作系统</span>
                        <span className="capitalize">{systemInfo?.platform} ({systemInfo?.arch})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">Node.js 版本</span>
                        <span className="font-mono">{systemInfo?.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                        <span className="text-gray-500 dark:text-slate-400">负载 (1/5/15 min)</span>
                        <span className="font-mono text-sm">{systemInfo?.loadAvg?.map((l: number) => l.toFixed(2)).join(' / ')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-500 dark:text-slate-400">自动启动</span>
                        <span className="text-emerald-500 flex items-center gap-1 font-medium">
                          <Activity className="w-3 h-3" />
                          已启用 (Cloud Run)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {serverSubTab === 'logs' && (
              <div className={cn(
                "p-6 rounded-2xl border transition-colors",
                isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <List className="w-5 h-5 text-indigo-500" />
                    最近系统日志
                  </h3>
                  <button 
                    onClick={fetchData}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[500px] overflow-y-auto space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-gray-600 italic">暂无日志记录...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-gray-500 shrink-0">[{format(parseISO(log.timestamp), 'HH:mm:ss')}]</span>
                        <span className={cn(
                          "shrink-0 font-bold uppercase w-12",
                          log.level === 'error' ? "text-rose-500" : "text-indigo-400"
                        )}>{log.level}</span>
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {serverSubTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={cn(
                  "p-6 rounded-2xl border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    通用设置
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">服务器名称</label>
                      <input 
                        type="text" 
                        defaultValue="凯浩大人记账助手 Server"
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">日志保留条数</label>
                      <input 
                        type="number" 
                        defaultValue={50}
                        className={cn(
                          "w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 transition-colors",
                          isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-200 text-gray-900"
                        )}
                      />
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                      保存设置
                    </button>
                  </div>
                </div>

                <div className={cn(
                  "p-6 rounded-2xl border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
                )}>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-rose-500" />
                    安全与维护
                  </h3>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="text-left">
                        <p className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">备份数据库</p>
                        <p className="text-xs text-gray-500">立即创建 finance.json 的备份</p>
                      </div>
                      <Database className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group">
                      <div className="text-left">
                        <p className="font-medium text-rose-600">重启服务</p>
                        <p className="text-xs text-rose-500/70">强制重启后台进程</p>
                      </div>
                      <RefreshCw className="w-5 h-5 text-rose-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard({ title, value, icon, isDarkMode }: { title: string, value: string, icon: React.ReactNode, isDarkMode: boolean }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border flex items-center gap-4 transition-colors",
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        isDarkMode ? "bg-slate-800" : "bg-gray-50"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{title}</p>
        <p className={cn("text-lg font-bold", isDarkMode ? "text-slate-100" : "text-gray-900")}>{value}</p>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon, trend, isDarkMode }: { title: string, amount: number, icon: React.ReactNode, trend: 'positive' | 'negative', isDarkMode: boolean }) {
  return (
    <div className={cn(
      "p-6 rounded-2xl shadow-sm border transition-colors flex items-center justify-between",
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"
    )}>
      <div>
        <p className={cn("text-sm font-medium mb-1", isDarkMode ? "text-slate-400" : "text-gray-500")}>{title}</p>
        <h3 className={cn("text-2xl font-bold tracking-tight transition-colors", 
          isDarkMode ? "text-slate-100" : "text-gray-900"
        )}>
          ¥{amount.toFixed(2)}
        </h3>
      </div>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        isDarkMode ? "bg-slate-800" : "bg-gray-50"
      )}>
        {icon}
      </div>
    </div>
  );
}
