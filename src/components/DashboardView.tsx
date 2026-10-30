import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Receipt,
  Download,
  Filter,
  Flame,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  UtensilsCrossed,
  Bus,
  GraduationCap,
  ShoppingBag,
  Film,
  HeartPulse,
  Target,
  Plus,
  Laptop,
  X,
  Check
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { Transaction, BudgetConfig, ExpenseCategory, CATEGORY_COLORS, CategorySummary } from '../types';
import { downloadSampleCSV } from '../utils/sampleData';

interface DashboardViewProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  onNavigateTab: (tab: any) => void;
  onAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budget,
  onNavigateTab,
  onAddExpense,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or '2026-10'

  // Savings Goal State
  const [savingsGoal, setSavingsGoal] = useState<{
    name: string;
    savedAmount: number;
    targetAmount: number;
  }>(() => {
    const saved = localStorage.getItem('sea_savings_goal');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
      name: 'MacBook Pro for College',
      savedAmount: 680,
      targetAmount: 1200,
    };
  });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalNameInput, setGoalNameInput] = useState(savingsGoal.name);
  const [goalTargetInput, setGoalTargetInput] = useState(savingsGoal.targetAmount.toString());
  const [goalSavedInput, setGoalSavedInput] = useState(savingsGoal.savedAmount.toString());

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetInput) || 1200;
    const saved = parseFloat(goalSavedInput) || 0;
    const updated = {
      name: goalNameInput.trim() || 'Study Laptop',
      savedAmount: Math.max(0, saved),
      targetAmount: Math.max(1, target),
    };
    setSavingsGoal(updated);
    localStorage.setItem('sea_savings_goal', JSON.stringify(updated));
    setIsGoalModalOpen(false);
  };

  // Available months extracted from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions for selected period
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 1. Total monthly expenditure
  const totalExpenditure = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  // 2. Average daily expenditure
  const averageDailyExpenditure = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    // Calculate distinct dates or days in month
    const dates = filteredTransactions.map(t => t.date);
    const uniqueDates = new Set(dates);
    // If filtering by specific month, use either days elapsed or 30 days
    if (selectedMonth !== 'all') {
      const parts = selectedMonth.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const daysInMonth = new Date(year, month, 0).getDate();
      return totalExpenditure / (uniqueDates.size > 0 ? Math.max(uniqueDates.size, Math.min(daysInMonth, 28)) : 1);
    }
    const daysCount = Math.max(1, uniqueDates.size);
    return totalExpenditure / daysCount;
  }, [filteredTransactions, totalExpenditure, selectedMonth]);

  // 3. Category summaries
  const categorySummaries: CategorySummary[] = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    
    filteredTransactions.forEach(t => {
      const cat = t.category || 'Others';
      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += t.amount;
      map[cat].count += 1;
    });

    const list: CategorySummary[] = Object.keys(map).map(catKey => {
      const cat = catKey as ExpenseCategory;
      const amt = map[cat].amount;
      const pct = totalExpenditure > 0 ? (amt / totalExpenditure) * 100 : 0;
      const colorObj = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Others'];
      return {
        category: cat,
        amount: amt,
        percentage: Math.round(pct * 10) / 10,
        count: map[cat].count,
        color: colorObj.primary,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpenditure]);

  // Exact metrics for the 6 core requested categories
  const coreCategoryMetrics = useMemo(() => {
    const metrics: Record<
      'Food' | 'Transport' | 'Education' | 'Shopping' | 'Entertainment' | 'Health',
      { amount: number; count: number }
    > = {
      Food: { amount: 0, count: 0 },
      Transport: { amount: 0, count: 0 },
      Education: { amount: 0, count: 0 },
      Shopping: { amount: 0, count: 0 },
      Entertainment: { amount: 0, count: 0 },
      Health: { amount: 0, count: 0 },
    };

    filteredTransactions.forEach(t => {
      const cat = t.category;
      if (cat in metrics) {
        metrics[cat as keyof typeof metrics].amount += t.amount;
        metrics[cat as keyof typeof metrics].count += 1;
      }
    });

    return metrics;
  }, [filteredTransactions]);

  // 4. Highest spending category
  const highestCategory = categorySummaries[0] || null;

  // 5. Number of transactions
  const transactionCount = filteredTransactions.length;

  // 6. Top 5 expenses
  const topFiveExpenses = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Daily timeline data for Recharts AreaChart
  const dailyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      map[t.date] = (map[t.date] || 0) + t.amount;
    });
    return Object.keys(map)
      .sort()
      .map(date => ({
        date: date.slice(5), // MM-DD
        fullDate: date,
        amount: Math.round(map[date] * 100) / 100,
      }));
  }, [filteredTransactions]);

  // Donut chart data
  const donutData = useMemo(() => {
    return categorySummaries.map(item => ({
      name: item.category,
      value: Math.round(item.amount * 100) / 100,
      color: item.color,
    }));
  }, [categorySummaries]);

  // Budget calculations
  const remainingBudget = Math.max(0, budget.monthlyBudget - totalExpenditure);
  const budgetUtilization = budget.monthlyBudget > 0 
    ? Math.round((totalExpenditure / budget.monthlyBudget) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#121218] p-3.5 sm:p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Student Financial Pulse</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
            Real-time analytics across your college spending categories and budget limits.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#17171D] border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium text-xs"
            >
              <option value="all" className="bg-[#17171D] text-white">All Records</option>
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-[#17171D] text-white">
                  {new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-[#9A9AA5] hover:text-white bg-[#17171D] border border-white/10 hover:border-white/20 transition-colors"
            title="Download Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-[#3DDC97]" />
            <span className="inline">Sample CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Core Dynamic KPI Metrics Cards (Compact 2x2 grid on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Metric 1: Total Expenditure */}
        <div className="bg-[#17171D] p-3 sm:p-5 rounded-2xl sm:rounded-[20px] border border-white/10 hover:border-[#7C5CFF]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[#9A9AA5] text-[11px] sm:text-xs font-medium mb-1.5">
            <span className="truncate">Total Spend</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF] shrink-0">
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-white tracking-tight truncate">
            {budget.currency}{totalExpenditure.toFixed(2)}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#9A9AA5] flex items-center justify-between flex-wrap gap-1">
            <span className="hidden sm:inline">Budget: {budget.currency}{budget.monthlyBudget.toFixed(0)}</span>
            <span className={`font-mono font-semibold ${budgetUtilization > 100 ? 'text-[#FF6B6B]' : budgetUtilization > 85 ? 'text-[#FBBF24]' : 'text-[#3DDC97]'}`}>
              {budgetUtilization}% Used
            </span>
          </div>
        </div>

        {/* Metric 2: Average Daily Expenditure */}
        <div className="bg-[#17171D] p-3 sm:p-5 rounded-2xl sm:rounded-[20px] border border-white/10 hover:border-[#3DDC97]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[#9A9AA5] text-[11px] sm:text-xs font-medium mb-1.5">
            <span className="truncate">Daily Pace</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#3DDC97]/15 border border-[#3DDC97]/30 flex items-center justify-center text-[#3DDC97] shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-white tracking-tight truncate">
            {budget.currency}{averageDailyExpenditure.toFixed(2)}
            <span className="text-[10px] sm:text-xs font-normal text-[#9A9AA5]">/d</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#9A9AA5] truncate">
            Active spending run-rate
          </div>
        </div>

        {/* Metric 3: Highest Spending Category */}
        <div className="bg-[#17171D] p-3 sm:p-5 rounded-2xl sm:rounded-[20px] border border-white/10 hover:border-[#FF6B6B]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[#9A9AA5] text-[11px] sm:text-xs font-medium mb-1.5">
            <span className="truncate">Top Bucket</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 flex items-center justify-center text-[#FF6B6B] shrink-0">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-bold text-white tracking-tight truncate">
            {highestCategory ? highestCategory.category : 'None'}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#9A9AA5] flex items-center justify-between flex-wrap gap-1">
            {highestCategory ? (
              <>
                <span className="font-mono text-white truncate">{budget.currency}{highestCategory.amount.toFixed(0)}</span>
                <span className="text-[#FF6B6B] font-semibold">{highestCategory.percentage}%</span>
              </>
            ) : (
              <span>No transactions</span>
            )}
          </div>
        </div>

        {/* Metric 4: Total Number of Transactions */}
        <div className="bg-[#17171D] p-3 sm:p-5 rounded-2xl sm:rounded-[20px] border border-white/10 hover:border-[#7C5CFF]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between text-[#9A9AA5] text-[11px] sm:text-xs font-medium mb-1.5">
            <span className="truncate">Transactions</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-white tracking-tight">
            {transactionCount}
          </div>
          <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-[#9A9AA5] flex items-center justify-between">
            <span className="truncate">{categorySummaries.length} categories</span>
            <button 
              onClick={() => onNavigateTab('transactions')}
              className="text-[#7C5CFF] hover:underline font-medium"
            >
              View
            </button>
          </div>
        </div>

      </div>

      {/* Redesigned Section: Stylish Expense Categories & Beautiful Savings Goals Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EXPENSE CATEGORIES SECTION (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-[#0B1021] border border-white/10 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-[0_12px_40px_rgba(3,7,18,0.5)] relative overflow-hidden flex flex-col justify-between">
          {/* Subtle ambient radial glows */}
          <div className="absolute -top-16 -left-16 w-52 h-52 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                    Student Categories
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
                  Expense Categories
                </h3>
                <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
                  Live expenditure across your primary campus spending buckets
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('transactions')}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold group transition-colors px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 shrink-0"
                >
                  <span>Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* 6 Category Rounded Icon Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
              
              {/* 1. Food */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-orange-500/20 hover:border-orange-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(249,115,22,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)] group-hover:scale-105 transition-transform">
                    <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-orange-300/80 bg-orange-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-orange-500/20">
                    {coreCategoryMetrics.Food.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Food
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Food.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Food.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

              {/* 2. Transport */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(6,182,212,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
                    <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-cyan-300/80 bg-cyan-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {coreCategoryMetrics.Transport.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Transport
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Transport.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Transport.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

              {/* 3. Education */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(168,85,247,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)] group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-purple-300/80 bg-purple-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-purple-500/20">
                    {coreCategoryMetrics.Education.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Education
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Education.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Education.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

              {/* 4. Shopping */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(236,72,153,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.25)] group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-pink-300/80 bg-pink-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-pink-500/20">
                    {coreCategoryMetrics.Shopping.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Shopping
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Shopping.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Shopping.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

              {/* 5. Entertainment */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-violet-500/20 hover:border-violet-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(139,92,246,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform">
                    <Film className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-violet-300/80 bg-violet-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-violet-500/20">
                    {coreCategoryMetrics.Entertainment.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Entertainment
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Entertainment.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Entertainment.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

              {/* 6. Health */}
              <div 
                onClick={() => onNavigateTab('transactions')}
                className="bg-[#0e162e]/90 hover:bg-[#121c3b] border border-rose-500/20 hover:border-rose-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(244,63,94,0.18)] cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] group-hover:scale-105 transition-transform">
                    <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-rose-300/80 bg-rose-500/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-500/20">
                    {coreCategoryMetrics.Health.count} txns
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors block">
                    Health
                  </span>
                  <div className="text-sm sm:text-base font-bold font-mono text-white tracking-tight mt-0.5">
                    {budget.currency}{coreCategoryMetrics.Health.amount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-[#9A9AA5] mt-0.5">
                    {totalExpenditure > 0 ? ((coreCategoryMetrics.Health.amount / totalExpenditure) * 100).toFixed(1) : 0}% of expenses
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Footnote */}
          <div className="mt-4 sm:mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#9A9AA5]">
            <span className="flex items-center gap-1.5 text-[11px] sm:text-xs truncate mr-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Keyword categorized</span>
            </span>
            <button
              onClick={() => onNavigateTab('add-expenses')}
              className="text-[11px] sm:text-xs text-cyan-400 hover:underline font-semibold shrink-0"
            >
              + Log Expense
            </button>
          </div>
        </div>

        {/* SAVINGS GOALS CARD (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0D152D] via-[#0E1733] to-[#0A0E22] border border-purple-500/30 rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-[0_12px_40px_rgba(124,92,255,0.15)] relative overflow-hidden flex flex-col justify-between">
          {/* Subtle ambient glow blurs */}
          <div className="absolute -top-14 -right-14 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-14 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/25 to-cyan-500/20 border border-purple-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.35)] shrink-0">
                  <Target className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
                      Savings Goals
                    </span>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                  </div>
                  <h4 className="text-base md:text-lg font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-[210px]">
                    {savingsGoal.name}
                  </h4>
                </div>
              </div>

              {/* Percentage Badge */}
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold text-white bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 shadow-sm shrink-0">
                {savingsGoal.targetAmount > 0
                  ? Math.min(100, Math.round((savingsGoal.savedAmount / savingsGoal.targetAmount) * 100))
                  : 0}%
              </span>
            </div>

            {/* Laptop Vector Artwork */}
            <div className="my-2 py-1 flex items-center justify-center relative">
              <div className="absolute w-44 h-20 bg-gradient-to-r from-purple-600/30 via-cyan-500/20 to-pink-500/25 rounded-full blur-2xl pointer-events-none" />
              
              <svg viewBox="0 0 240 120" className="w-full max-w-[210px] h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="laptopScreenGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#190e33" />
                    <stop offset="50%" stopColor="#0c1d3b" />
                    <stop offset="100%" stopColor="#140d2b" />
                  </linearGradient>
                  <linearGradient id="laptopChartGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C5CFF" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                  <linearGradient id="laptopBodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="laptopGlowLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#F472B6" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Base Shadow */}
                <ellipse cx="120" cy="112" rx="90" ry="6" fill="#020617" fillOpacity="0.7" filter="blur(3px)" />

                {/* Screen Lid Frame */}
                <rect x="42" y="10" width="156" height="84" rx="8" fill="#131B2E" stroke="#334155" strokeWidth="1.5" />
                {/* Screen Display */}
                <rect x="46" y="14" width="148" height="76" rx="5" fill="url(#laptopScreenGrad)" />
                {/* Camera dot */}
                <circle cx="120" cy="12.5" r="1" fill="#64748B" />

                {/* UI Inside Laptop Screen */}
                <rect x="53" y="21" width="44" height="4" rx="2" fill="#38BDF8" fillOpacity="0.5" />
                {/* Screen Chart Line & Area */}
                <path d="M54 62 L74 52 L94 57 L114 42 L134 48 L154 36 L174 44 L184 38" stroke="url(#laptopChartGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M54 62 L74 52 L94 57 L114 42 L134 48 L154 36 L174 44 L184 38 L184 72 L54 72 Z" fill="url(#laptopChartGrad)" fillOpacity="0.14" />
                
                {/* Visual Chart Bars */}
                <rect x="54" y="65" width="6" height="7" rx="1" fill="#7C5CFF" fillOpacity="0.85" />
                <rect x="64" y="62" width="6" height="10" rx="1" fill="#06B6D4" fillOpacity="0.85" />
                <rect x="74" y="58" width="6" height="14" rx="1" fill="#F472B6" fillOpacity="0.85" />
                <rect x="84" y="66" width="6" height="6" rx="1" fill="#FB923C" fillOpacity="0.85" />
                
                <circle cx="170" cy="24" r="5" fill="#06B6D4" fillOpacity="0.25" stroke="#06B6D4" strokeWidth="1" />
                <path d="M168 24 L169.5 25.5 L172.5 22.5" stroke="#06B6D4" strokeWidth="1" strokeLinecap="round" />

                {/* Gloss highlight diagonal */}
                <path d="M47 15 L110 15 L78 89 L47 89 Z" fill="#FFFFFF" fillOpacity="0.03" />

                {/* Hinge */}
                <path d="M102 94 L138 94 L136 97 L104 97 Z" fill="#334155" />
                {/* Base Laptop Body */}
                <path d="M22 97 L218 97 L206 109 C204 111 200 112 196 112 L44 112 C40 112 36 111 34 109 L22 97 Z" fill="url(#laptopBodyGrad)" stroke="#334155" strokeWidth="1" />
                {/* Keyboard Recess */}
                <rect x="48" y="99" width="144" height="6" rx="1.5" fill="#090D17" stroke="#1E293B" strokeWidth="0.5" />
                {/* Trackpad */}
                <rect x="104" y="106" width="32" height="4" rx="1" fill="#131B2E" stroke="#334155" strokeWidth="0.5" />
                {/* Bottom Lip Glow Edge */}
                <line x1="38" y1="111.5" x2="202" y2="111.5" stroke="url(#laptopGlowLine)" strokeWidth="1" />
              </svg>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9A9AA5] font-medium">Goal Completion</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {savingsGoal.targetAmount > 0
                    ? Math.min(100, Math.round((savingsGoal.savedAmount / savingsGoal.targetAmount) * 100))
                    : 0}%
                </span>
              </div>

              <div className="w-full bg-[#070B18] h-3.5 rounded-full p-0.5 border border-white/10 shadow-inner overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C5CFF] via-[#06B6D4] to-[#F472B6] transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  style={{
                    width: `${Math.min(100, savingsGoal.targetAmount > 0 ? (savingsGoal.savedAmount / savingsGoal.targetAmount) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>

            {/* Saved vs Target Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#090E20]/90 border border-white/5 my-3">
              <div>
                <span className="text-[11px] text-[#9A9AA5] block">Saved Amount</span>
                <p className="font-mono text-base font-extrabold text-cyan-300">
                  {budget.currency}{savingsGoal.savedAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#9A9AA5] block">Target Goal</span>
                <p className="font-mono text-base font-bold text-white">
                  {budget.currency}{savingsGoal.targetAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Attractive Glowing + Add Goal Button */}
          <div className="relative z-10 pt-1">
            <button
              onClick={() => {
                setGoalNameInput(savingsGoal.name);
                setGoalTargetInput(savingsGoal.targetAmount.toString());
                setGoalSavedInput(savingsGoal.savedAmount.toString());
                setIsGoalModalOpen(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7C5CFF] via-[#06B6D4] to-[#F472B6] hover:opacity-95 shadow-[0_0_22px_rgba(124,92,255,0.45)] hover:shadow-[0_0_32px_rgba(6,182,212,0.65)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 border border-white/20 group cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
              <span>+ Add Goal</span>
            </button>
          </div>
        </div>

      </div>

      {/* Edit / Add Savings Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0D152D] border border-purple-500/30 rounded-[24px] max-w-md w-full p-6 space-y-5 shadow-[0_20px_60px_rgba(3,7,18,0.9)] relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Configure Savings Goal</span>
              </div>
              <button 
                onClick={() => setIsGoalModalOpen(false)}
                className="text-[#9A9AA5] hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro for College, Summer Travel, Study Abroad..."
                  value={goalNameInput}
                  onChange={(e) => setGoalNameInput(e.target.value)}
                  className="w-full bg-[#070B18] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">Target Amount ({budget.currency})</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={goalTargetInput}
                    onChange={(e) => setGoalTargetInput(e.target.value)}
                    className="w-full bg-[#070B18] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-medium">Currently Saved ({budget.currency})</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={goalSavedInput}
                    onChange={(e) => setGoalSavedInput(e.target.value)}
                    className="w-full bg-[#070B18] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Deposit Presets */}
              <div>
                <label className="block text-[#9A9AA5] mb-1.5 font-medium text-[11px]">
                  Quick Deposit to Goal:
                </label>
                <div className="flex items-center gap-2">
                  {[25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(goalSavedInput) || 0;
                        setGoalSavedInput((cur + amt).toString());
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-mono text-xs font-semibold"
                    >
                      +{budget.currency}{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 text-[#9A9AA5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-[#7C5CFF] to-[#06B6D4] hover:opacity-95 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Spending Velocity Area Chart */}
      <div className="bg-[#17171D] p-3.5 sm:p-6 rounded-2xl sm:rounded-[24px] border border-white/10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Daily Spending Velocity</h3>
            <p className="text-[10px] sm:text-xs text-[#9A9AA5]">Spending spikes and timeline patterns throughout cycle</p>
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#3DDC97]/30 shrink-0">
            {dailyChartData.length} active days
          </span>
        </div>

        {dailyChartData.length === 0 ? (
          <div className="py-10 text-center text-[#9A9AA5] text-xs">No daily records found.</div>
        ) : (
          <div className="h-44 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#9A9AA5', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" />
                <YAxis width={40} tick={{ fill: '#9A9AA5', fontSize: 10 }} stroke="rgba(255, 255, 255, 0.1)" tickFormatter={(v) => `${budget.currency}${v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#121218] border border-white/10 p-2.5 rounded-xl shadow-xl text-xs">
                          <p className="text-[#9A9AA5]">{data.fullDate}</p>
                          <p className="font-bold text-white font-mono text-sm">{budget.currency}{data.amount.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#7C5CFF" strokeWidth={2.5} fillOpacity={1} fill="url(#spendingGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Five Expenses & Spending Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Top Five Expenses (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-[#17171D] p-4 sm:p-6 rounded-2xl sm:rounded-[24px] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Top 5 Expenses</h3>
                <p className="text-[10px] sm:text-xs text-[#9A9AA5]">Largest individual purchases during this cycle</p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-[#7C5CFF] hover:underline font-semibold shrink-0"
              >
                View all
              </button>
            </div>

            {topFiveExpenses.length === 0 ? (
              <div className="py-10 text-center text-[#9A9AA5] text-xs">
                No expense entries yet. Click "Add Expense" to log your first transaction.
              </div>
            ) : (
              <div className="space-y-2">
                {topFiveExpenses.map((tx, idx) => {
                  const catColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Others'];
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B0B0F]/60 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-white/5 text-white flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">{tx.description}</p>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#9A9AA5] mt-0.5">
                            <span>{tx.date}</span>
                            <span>·</span>
                            <span style={{ color: catColor.primary }}>{tx.category}</span>
                            <span className="hidden sm:inline">·</span>
                            <span className="hidden sm:inline">{tx.source}</span>
                          </div>
                        </div>
                      </div>

                      <div className="font-mono text-xs sm:text-sm font-bold text-white shrink-0 ml-3">
                        {budget.currency}{tx.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 sm:pt-4 border-t border-white/10 mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-[#9A9AA5]">
            <span>Top 5: <strong className="text-white font-mono">{budget.currency}{topFiveExpenses.reduce((s, t) => s + t.amount, 0).toFixed(2)}</strong></span>
            <span>Total: <strong className="text-white font-mono">{filteredTransactions.length} txns</strong></span>
          </div>
        </div>

        {/* Spending Summary (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-[#17171D] p-4 sm:p-6 rounded-2xl sm:rounded-[24px] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3DDC97]" />
                  <span>Student Spending Summary</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-[#9A9AA5]">Automated diagnosis of your monthly run-rate</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Health Score / Alert */}
              <div className={`p-4 rounded-2xl border ${
                budgetUtilization > 100 
                  ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30 text-[#FF6B6B]' 
                  : budgetUtilization > 80 
                  ? 'bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]' 
                  : 'bg-[#3DDC97]/10 border-[#3DDC97]/30 text-[#3DDC97]'
              }`}>
                <div className="flex items-start gap-2.5">
                  {budgetUtilization > 100 ? (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      {budgetUtilization > 100 
                        ? 'Budget Overrun Detected' 
                        : budgetUtilization > 80 
                        ? 'Approaching Limit Threshold' 
                        : 'Budget On Track'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {budgetUtilization > 100 
                        ? `You have exceeded your monthly limit by ${budget.currency}${(totalExpenditure - budget.monthlyBudget).toFixed(2)}. Rebalance your entertainment and food expenditures.`
                        : budgetUtilization > 80
                        ? `You have spent ${budgetUtilization}% of your ${budget.currency}${budget.monthlyBudget} budget. Maintain caution for remaining days.`
                        : `Healthy run rate. You have ${budget.currency}${remainingBudget.toFixed(2)} remaining cushion before cycle reset.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stat Blocks */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#0B0B0F]/60 rounded-xl border border-white/5">
                  <span className="text-[#9A9AA5]">Remaining Cushion</span>
                  <div className="text-base font-bold font-mono text-[#3DDC97] mt-1">
                    {budget.currency}{remainingBudget.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-[#0B0B0F]/60 rounded-xl border border-white/5">
                  <span className="text-[#9A9AA5]">Daily Safe Allowance</span>
                  <div className="text-base font-bold font-mono text-[#7C5CFF] mt-1">
                    {budget.currency}{(remainingBudget / 10).toFixed(2)} <span className="text-[10px] text-[#9A9AA5]">/day</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#9A9AA5] leading-relaxed">
                {highestCategory 
                  ? `Your primary expense category is ${highestCategory.category} (${budget.currency}${highestCategory.amount.toFixed(2)}), representing ${highestCategory.percentage}% of all outgoings.`
                  : 'Start recording expenses to unveil detailed student spending insights.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4 flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('spending-insights')}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors text-center"
            >
              Detailed Insights
            </button>
            <button
              onClick={() => onNavigateTab('budget-planner')}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-[#7C5CFF] hover:bg-[#6a47fc] text-white transition-colors text-center shadow-sm"
            >
              Adjust Budget
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
