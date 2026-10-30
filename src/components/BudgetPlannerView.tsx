import React, { useState } from 'react';
import { 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Percent, 
  Save, 
  Calendar,
  Sparkles,
  HelpCircle,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  BudgetConfig, 
  Transaction, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  CATEGORY_COLORS 
} from '../types';

interface BudgetPlannerViewProps {
  budget: BudgetConfig;
  onUpdateBudget: (newBudget: BudgetConfig) => void;
  transactions: Transaction[];
  currency: string;
  onNavigateTab: (tab: any) => void;
}

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({
  budget,
  onUpdateBudget,
  transactions,
  currency,
  onNavigateTab,
}) => {
  const [totalInput, setTotalInput] = useState<string>(budget.monthlyBudget.toString());
  const [categoryInputs, setCategoryInputs] = useState<Partial<Record<ExpenseCategory, string>>>(() => {
    const init: Partial<Record<ExpenseCategory, string>> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      init[cat] = (budget.categoryBudgets[cat] || '').toString();
    });
    return init;
  });
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Compute total expenses from transactions
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const remaining = budget.monthlyBudget - totalSpent;
  const isOverBudget = remaining < 0;
  const utilizationPercent = budget.monthlyBudget > 0
    ? Math.round((totalSpent / budget.monthlyBudget) * 100)
    : 0;

  // Category-wise spending
  const categorySpentMap: Record<ExpenseCategory, number> = {
    Food: 0,
    Transport: 0,
    Education: 0,
    Accommodation: 0,
    Shopping: 0,
    Entertainment: 0,
    Health: 0,
    Others: 0,
  };

  transactions.forEach(t => {
    if (categorySpentMap[t.category] !== undefined) {
      categorySpentMap[t.category] += t.amount;
    } else {
      categorySpentMap['Others'] += t.amount;
    }
  });

  // Calculate days remaining in current month
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - today.getDate());
  const dailyAllowance = Math.max(0, remaining) / daysRemaining;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(totalInput);
    if (isNaN(parsedTotal) || parsedTotal <= 0) return;

    const newCategoryBudgets: Partial<Record<ExpenseCategory, number>> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      const val = parseFloat(categoryInputs[cat] || '0');
      if (!isNaN(val) && val > 0) {
        newCategoryBudgets[cat] = val;
      }
    });

    onUpdateBudget({
      ...budget,
      monthlyBudget: Math.round(parsedTotal * 100) / 100,
      categoryBudgets: newCategoryBudgets,
    });

    setSaveFeedback('Budget preferences saved successfully!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const applyStudentPreset = (presetName: string, total: number, catMap: Partial<Record<ExpenseCategory, number>>) => {
    setTotalInput(total.toString());
    const newInputs: Partial<Record<ExpenseCategory, string>> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      newInputs[cat] = (catMap[cat] || 0).toString();
    });
    setCategoryInputs(newInputs);

    onUpdateBudget({
      ...budget,
      monthlyBudget: total,
      categoryBudgets: catMap,
    });

    setSaveFeedback(`Loaded "${presetName}" preset (${currency}${total}/mo)!`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121218] p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#7C5CFF]" />
            <span>Monthly Budget Planner</span>
          </h1>
          <p className="text-xs text-[#9A9AA5] mt-1">
            Establish overall monthly limits and allocate category caps for college living.
          </p>
        </div>

        {saveFeedback && (
          <div className="px-3.5 py-1.5 rounded-xl bg-[#3DDC97]/20 border border-[#3DDC97]/40 text-[#3DDC97] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveFeedback}</span>
          </div>
        )}
      </div>

      {/* Budget Overrun Warnings */}
      {isOverBudget ? (
        <div className="p-4 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/40 text-[#FF6B6B] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Monthly Budget Exceeded!</h3>
            <p className="text-xs text-slate-200">
              Total spending ({currency}{totalSpent.toFixed(2)}) has exceeded your {currency}{budget.monthlyBudget.toFixed(2)} monthly ceiling by{' '}
              <strong className="text-white font-mono">{currency}{Math.abs(remaining).toFixed(2)}</strong> ({utilizationPercent}% utilization).
              Consider trimming non-essential Entertainment and Shopping outlays.
            </p>
          </div>
        </div>
      ) : utilizationPercent >= 85 ? (
        <div className="p-4 rounded-2xl bg-[#FBBF24]/15 border border-[#FBBF24]/40 text-[#FBBF24] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Budget Warning: Approaching 100% Limit</h3>
            <p className="text-xs text-slate-200">
              You have spent <strong className="text-white font-mono">{utilizationPercent}%</strong> of your monthly allocation. Only {currency}{remaining.toFixed(2)} remains for the remaining {daysRemaining} days.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#3DDC97]/10 border border-[#3DDC97]/30 text-[#3DDC97] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Budget On Track</h3>
            <p className="text-xs text-slate-200">
              You have spent {currency}{totalSpent.toFixed(2)} ({utilizationPercent}%) of your {currency}{budget.monthlyBudget.toFixed(2)} limit. Safe daily spending pace is <strong className="text-white font-mono">{currency}{dailyAllowance.toFixed(2)} / day</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 3 Core Summary Cards (Compact grid on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Card 1: Monthly Budget */}
        <div className="bg-[#17171D] p-3.5 sm:p-5 rounded-2xl sm:rounded-[22px] border border-white/10">
          <span className="text-[11px] sm:text-xs text-[#9A9AA5] font-medium">Monthly Budget</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            {currency}{budget.monthlyBudget.toFixed(2)}
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#9A9AA5] flex items-center justify-between">
            <span>Cycle</span>
            <span className="text-white font-medium">Current Month</span>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="bg-[#17171D] p-3.5 sm:p-5 rounded-2xl sm:rounded-[22px] border border-white/10">
          <span className="text-[11px] sm:text-xs text-[#9A9AA5] font-medium">Total Expenses Recorded</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
            {currency}{totalSpent.toFixed(2)}
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#9A9AA5] flex items-center justify-between">
            <span>Transactions</span>
            <span className="text-white font-medium">{transactions.length} items</span>
          </div>
        </div>

        {/* Card 3: Remaining Budget & Utilization */}
        <div className="bg-[#17171D] p-3.5 sm:p-5 rounded-2xl sm:rounded-[22px] border border-white/10">
          <span className="text-[11px] sm:text-xs text-[#9A9AA5] font-medium">Remaining Cushion</span>
          <div className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${isOverBudget ? 'text-[#FF6B6B]' : 'text-[#3DDC97]'}`}>
            {isOverBudget ? '-' : ''}{currency}{Math.abs(remaining).toFixed(2)}
          </div>
          <div className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-[#9A9AA5] flex items-center justify-between">
            <span>Utilization</span>
            <span className={`font-mono font-bold ${isOverBudget ? 'text-[#FF6B6B]' : 'text-[#7C5CFF]'}`}>
              {utilizationPercent}%
            </span>
          </div>
        </div>

      </div>

      {/* Budget Progress Bar */}
      <div className="bg-[#17171D] p-3.5 sm:p-6 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
          <span className="text-white font-bold flex items-center gap-1.5">
            <span>Overall Budget Consumption</span>
            <span className="font-mono text-[#9A9AA5]">({utilizationPercent}%)</span>
          </span>
          <span className="font-mono text-[#9A9AA5] text-[11px] sm:text-xs">
            {currency}{totalSpent.toFixed(2)} / {currency}{budget.monthlyBudget.toFixed(2)}
          </span>
        </div>

        <div className="w-full bg-[#0B0B0F] h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, utilizationPercent)}%`,
              backgroundColor: isOverBudget ? '#FF6B6B' : utilizationPercent > 80 ? '#FBBF24' : '#3DDC97',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#9A9AA5] pt-0.5 sm:pt-1">
          <span>0%</span>
          <span>50%</span>
          <span>80% Warning</span>
          <span className="text-[#FF6B6B]">100% Max</span>
        </div>
      </div>

      {/* Quick Presets for College Students */}
      <div className="bg-[#17171D] p-3.5 sm:p-6 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
            <span>Campus Budget Presets</span>
          </h3>
          <p className="text-xs text-[#9A9AA5] mt-0.5">
            Quickly calibrate sensible monthly student budget allocations with one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <button
            onClick={() => applyStudentPreset('Frugal Dorm Living', 750, {
              Accommodation: 350,
              Food: 200,
              Transport: 40,
              Education: 70,
              Shopping: 40,
              Entertainment: 30,
              Others: 20,
            })}
            className="p-4 rounded-xl bg-[#0B0B0F] border border-white/10 hover:border-[#3DDC97]/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-[#3DDC97] transition-colors">Frugal Dorm Living</span>
              <span className="text-xs font-mono font-bold text-[#3DDC97]">{currency}750/mo</span>
            </div>
            <p className="text-[11px] text-[#9A9AA5]">
              Strictly essentials: shared dorm, campus dining hall, transit pass, low retail.
            </p>
          </button>

          <button
            onClick={() => applyStudentPreset('Balanced Campus Life', 1200, {
              Accommodation: 500,
              Food: 320,
              Transport: 60,
              Education: 120,
              Shopping: 70,
              Entertainment: 80,
              Others: 50,
            })}
            className="p-4 rounded-xl bg-[#0B0B0F] border border-white/10 hover:border-[#7C5CFF]/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-[#7C5CFF] transition-colors">Balanced Campus Life</span>
              <span className="text-xs font-mono font-bold text-[#7C5CFF]">{currency}1,200/mo</span>
            </div>
            <p className="text-[11px] text-[#9A9AA5]">
              Standard student living: groceries, occasional takeout, social outings, textbooks.
            </p>
          </button>

          <button
            onClick={() => applyStudentPreset('Independent Off-Campus', 1800, {
              Accommodation: 850,
              Food: 450,
              Transport: 120,
              Education: 150,
              Shopping: 100,
              Entertainment: 100,
              Others: 30,
            })}
            className="p-4 rounded-xl bg-[#0B0B0F] border border-white/10 hover:border-[#FBBF24]/60 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover:text-[#FBBF24] transition-colors">Independent Off-Campus</span>
              <span className="text-xs font-mono font-bold text-[#FBBF24]">{currency}1,800/mo</span>
            </div>
            <p className="text-[11px] text-[#9A9AA5]">
              Off-campus apartment, utilities, car/rideshare, expanded meal options.
            </p>
          </button>

        </div>
      </div>

      {/* Edit Budget Form: Total & Category Allocations */}
      <form onSubmit={handleSaveBudget} className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-5 sm:space-y-6">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#7C5CFF]" />
            <span>Customize Allocations</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
            Adjust your overall monthly budget limit and optional category-level targets.
          </p>
        </div>

        {/* Overall Limit Input */}
        <div className="bg-[#0B0B0F] p-4 rounded-2xl border border-white/10">
          <label className="block text-xs font-semibold text-white mb-1.5">
            Monthly Overall Expenditure Limit ({currency})
          </label>
          <div className="relative max-w-sm">
            <span className="absolute left-3.5 top-2.5 text-[#9A9AA5] font-mono text-sm">
              {currency}
            </span>
            <input
              type="number"
              min="50"
              step="10"
              required
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              className="w-full bg-[#17171D] border border-white/10 focus:border-[#7C5CFF] rounded-xl pl-8 pr-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Category Limits Breakdown */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Category Spending Caps vs Actuals
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {EXPENSE_CATEGORIES.map(cat => {
              const spent = categorySpentMap[cat] || 0;
              const cap = parseFloat(categoryInputs[cat] || '0') || 0;
              const catUtil = cap > 0 ? Math.round((spent / cap) * 100) : 0;
              const catColor = CATEGORY_COLORS[cat];
              const isCatOver = cap > 0 && spent > cap;

              return (
                <div key={cat} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0B0B0F] border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor.primary }} />
                      <span>{cat}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[#9A9AA5] text-[11px]">Limit:</span>
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1 text-[11px] text-[#9A9AA5] font-mono">{currency}</span>
                        <input
                          type="number"
                          placeholder="No cap"
                          value={categoryInputs[cat] || ''}
                          onChange={(e) => setCategoryInputs({ ...categoryInputs, [cat]: e.target.value })}
                          className="w-full bg-[#17171D] border border-white/10 rounded-lg pl-5 pr-1.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#7C5CFF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cap > 0 ? Math.min(100, catUtil) : spent > 0 ? 30 : 0}%`,
                        backgroundColor: isCatOver ? '#FF6B6B' : catUtil > 80 ? '#FBBF24' : catColor.primary,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#9A9AA5] flex-wrap gap-1">
                    <span>Spent: <strong className="font-mono text-white">{currency}{spent.toFixed(2)}</strong></span>
                    {cap > 0 ? (
                      <span className={isCatOver ? 'text-[#FF6B6B] font-semibold' : 'text-[#3DDC97]'}>
                        {catUtil}% used ({isCatOver ? `+${currency}${(spent - cap).toFixed(2)} over` : `${currency}${(cap - spent).toFixed(2)} left`})
                      </span>
                    ) : (
                      <span>No target set</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] rounded-xl transition-all shadow-[0_0_20px_rgba(124,92,255,0.35)] flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Budget Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
