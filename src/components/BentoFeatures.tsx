import React, { useMemo, useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  PieChart as PieChartIcon, 
  ShieldCheck, 
  ArrowUpRight,
  Wallet,
  ReceiptText,
  PiggyBank,
  Target
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Transaction, BudgetConfig } from '../types';

interface BentoFeaturesProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  onNavigateTab: (tab: any) => void;
}

export const BentoFeatures: React.FC<BentoFeaturesProps> = ({
  transactions,
  budget,
  onNavigateTab,
}) => {
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const remaining = Math.max(0, budget.monthlyBudget - totalSpent);
  const percentUsed = budget.monthlyBudget > 0 ? Math.min(100, Math.round((totalSpent / budget.monthlyBudget) * 100)) : 0;

  const [savingsChartMode, setSavingsChartMode] = useState<'breakdown' | 'goal'>('breakdown');

  // Read student savings goal from localStorage
  const savingsGoal = useMemo(() => {
    try {
      const saved = localStorage.getItem('sea_savings_goal');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      name: 'MacBook Pro for College',
      savedAmount: 680,
      targetAmount: 1200,
    };
  }, []);

  const goalSaved = Math.max(0, savingsGoal.savedAmount || 680);
  const targetGoal = Math.max(1, savingsGoal.targetAmount || 1200);
  const retainedSurplus = Math.max(0, budget.monthlyBudget - totalSpent);
  const emergencyReserve = Math.round(goalSaved * 0.35) || 240;

  // Breakdown slices
  const breakdownData = useMemo(() => [
    { name: 'Goal Fund', value: goalSaved, color: '#3DDC97' }, // Emerald
    { name: 'Monthly Surplus', value: retainedSurplus > 0 ? retainedSurplus : 180, color: '#7C5CFF' }, // Purple
    { name: 'Emergency Reserve', value: emergencyReserve, color: '#20D2FE' }, // Cyan
  ], [goalSaved, retainedSurplus, emergencyReserve]);

  // Goal vs Target slices
  const goalProgressData = useMemo(() => [
    { name: 'Total Saved', value: goalSaved, color: '#3DDC97' },
    { name: 'Remaining Target', value: Math.max(0, targetGoal - goalSaved), color: '#334155' },
  ], [goalSaved, targetGoal]);

  const activeSavingsData = savingsChartMode === 'breakdown' ? breakdownData : goalProgressData;
  const currentTotalSavings = savingsChartMode === 'breakdown' 
    ? breakdownData.reduce((s, i) => s + i.value, 0)
    : goalSaved;

  return (
    <section className="w-full py-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#3DDC97] mb-2">
            <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
            <span>Product Highlights</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Designed Exclusively for Campus Finances
          </h2>
          <p className="text-[#9A9AA5] text-sm mt-1 max-w-xl">
            A high-precision financial control center built to master textbook bills, dorm rent, meal plans, and monthly allowances without spreadsheets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('add-expenses')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] transition-all shadow-[0_0_20px_rgba(124,92,255,0.35)]"
          >
            <span>Import Expenses</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid: 4-column layout with mixed spans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TILE 1 (2x2 Hero Tile): Core Financial Pulse & Live Budget Engine */}
        <div 
          onClick={() => onNavigateTab('budget-planner')}
          className="group relative cursor-pointer md:col-span-2 lg:col-span-2 lg:row-span-2 bg-[#17171D] rounded-[24px] p-5 sm:p-6 md:p-8 border border-white/10 hover:border-[#7C5CFF]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_24px_rgba(124,92,255,0.06)] hover:shadow-[0_8px_30px_rgba(124,92,255,0.22)] flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#7C5CFF]/25 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center text-[#7C5CFF]">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-medium text-[#3DDC97] bg-[#3DDC97]/10 border border-[#3DDC97]/30 px-3 py-1 rounded-full">
                Active Cycle: Oct 2026
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
              Real-Time Student Budget Engine
            </h3>
            <p className="text-[#9A9AA5] text-sm leading-relaxed mb-6">
              Dynamically computes your remaining daily run rate, alerts you before cafeteria or Amazon orders push you over, and tracks budget velocity across all 7 student expense pillars.
            </p>
          </div>

          {/* Interactive Mini-UI Snapshot */}
          <div className="bg-[#0B0B0F]/90 rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#9A9AA5]">
              <span>Monthly Budget Cap</span>
              <span className="font-mono text-white text-sm font-semibold">{budget.currency}{budget.monthlyBudget.toFixed(2)}</span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentUsed}%`,
                  backgroundColor: percentUsed > 90 ? '#FF6B6B' : percentUsed > 70 ? '#FBBF24' : '#3DDC97',
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
              <div>
                <p className="text-[11px] text-[#9A9AA5]">Spent</p>
                <p className="font-mono text-xs md:text-sm font-bold text-white">{budget.currency}{totalSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9A9AA5]">Remaining</p>
                <p className="font-mono text-xs md:text-sm font-bold text-[#3DDC97]">{budget.currency}{remaining.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#9A9AA5]">Utilization</p>
                <p className="font-mono text-xs md:text-sm font-bold text-[#7C5CFF]">{percentUsed}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* TILE 2 (2x1 Tile): Multi-Modal Ingestion */}
        <div 
          onClick={() => onNavigateTab('add-expenses')}
          className="group relative cursor-pointer md:col-span-2 lg:col-span-2 lg:row-span-1 bg-[#17171D] rounded-[24px] p-5 sm:p-6 border border-white/10 hover:border-[#3DDC97]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(61,220,151,0.05)] hover:shadow-[0_8px_30px_rgba(61,220,151,0.18)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden"
        >
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#3DDC97]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#3DDC97]/20 transition-all" />

          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#3DDC97]/20 border border-[#3DDC97]/30 flex items-center justify-center text-[#3DDC97]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-[#3DDC97]">4 Ingestion Workflows</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Instant Multi-Modal Import
            </h3>
            <p className="text-[#9A9AA5] text-xs leading-relaxed">
              Drop bank CSVs, Excel (.xlsx) sheets, PDF statements, copy-paste raw text (<span className="text-white font-mono">Lunch 150</span>), or scan receipts.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">CSV & XLSX Autodetect</span>
            <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">Fast Text Parser</span>
            <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">Receipt OCR Ready</span>
          </div>
        </div>

        {/* TILE 3 (1x1 Tile): Big Stat - Student Adherence */}
        <div 
          onClick={() => onNavigateTab('dashboard')}
          className="group relative cursor-pointer lg:col-span-1 lg:row-span-1 bg-[#17171D] rounded-[24px] p-6 border border-white/10 hover:border-[#7C5CFF]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(124,92,255,0.05)] hover:shadow-[0_8px_25px_rgba(124,92,255,0.2)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9A9AA5]">Tracked Items</span>
            <ReceiptText className="w-4 h-4 text-[#7C5CFF]" />
          </div>

          <div className="my-2">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight group-hover:text-[#7C5CFF] transition-colors">
              {transactions.length}
            </div>
            <p className="text-[11px] text-[#3DDC97] font-medium mt-1">
              Live Verified Entries
            </p>
          </div>

          <p className="text-[11px] text-[#9A9AA5] leading-tight">
            Categorized automatically via keyword pattern recognition.
          </p>
        </div>

        {/* TILE 4 (1x1 Tile): Big Stat / Privacy */}
        <div 
          onClick={() => onNavigateTab('transactions')}
          className="group relative cursor-pointer lg:col-span-1 lg:row-span-1 bg-[#17171D] rounded-[24px] p-6 border border-white/10 hover:border-[#3DDC97]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(61,220,151,0.05)] hover:shadow-[0_8px_25px_rgba(61,220,151,0.2)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9A9AA5]">Security</span>
            <ShieldCheck className="w-4 h-4 text-[#3DDC97]" />
          </div>

          <div className="my-2">
            <div className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight group-hover:text-[#3DDC97] transition-colors">
              100%
            </div>
            <p className="text-[11px] text-[#3DDC97] font-medium mt-1">
              Client-Side Local State
            </p>
          </div>

          <p className="text-[11px] text-[#9A9AA5] leading-tight">
            Zero cloud telemetry or databases. Your student budget stays on your device.
          </p>
        </div>

        {/* TILE: Total Savings Pie Chart */}
        <div 
          onClick={() => onNavigateTab('dashboard')}
          className="group relative cursor-pointer md:col-span-2 lg:col-span-2 lg:row-span-1 bg-[#17171D] rounded-[24px] p-5 sm:p-6 border border-white/10 hover:border-[#3DDC97]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(61,220,151,0.05)] hover:shadow-[0_8px_25px_rgba(61,220,151,0.2)] flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#3DDC97]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#3DDC97]/20 transition-all" />

          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#3DDC97]/15 border border-[#3DDC97]/30 flex items-center justify-center text-[#3DDC97] shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white block truncate">Total Savings</span>
                <span className="text-[10px] sm:text-xs text-[#9A9AA5] block -mt-0.5 truncate">
                  {savingsChartMode === 'breakdown' ? 'Funds Breakdown' : savingsGoal.name}
                </span>
              </div>
            </div>

            {/* Mode Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSavingsChartMode(prev => prev === 'breakdown' ? 'goal' : 'breakdown');
              }}
              className="text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition-colors shrink-0 cursor-pointer"
              title="Toggle between Funds Breakdown & Goal Progress"
            >
              {savingsChartMode === 'breakdown' ? 'Breakdown' : 'Goal %'}
            </button>
          </div>

          {/* Interactive Recharts Pie/Donut Chart & Legend Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-auto relative z-10">
            <div className="relative flex items-center justify-center h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const totalSum = activeSavingsData.reduce((a, b) => a + b.value, 0) || 1;
                        const percent = (((Number(data.value)) / totalSum) * 100).toFixed(0);
                        return (
                          <div className="bg-[#0B0B0F]/95 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-xl shadow-2xl text-[11px] text-white z-50">
                            <div className="font-semibold text-slate-200">{data.name}</div>
                            <div className="font-mono font-bold text-[#3DDC97]">
                              {budget.currency}{Number(data.value).toFixed(0)}
                            </div>
                            <div className="text-[9px] text-[#9A9AA5]">
                              {percent}% of total
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={activeSavingsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#17171D"
                    strokeWidth={2}
                  >
                    {activeSavingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered KPI Value inside Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] text-[#9A9AA5] font-medium uppercase tracking-wider">
                  {savingsChartMode === 'breakdown' ? 'Total' : 'Saved'}
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-white tracking-tight">
                  {budget.currency}{currentTotalSavings.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Slices Legend & Percentage */}
            <div className="space-y-2">
              <div className="space-y-1.5 text-[11px] text-[#9A9AA5]">
                {savingsChartMode === 'breakdown' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3DDC97] shrink-0" />
                        <span>Goal Fund</span>
                      </span>
                      <span className="font-mono text-white font-medium">{budget.currency}{goalSaved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#7C5CFF] shrink-0" />
                        <span>Monthly Surplus</span>
                      </span>
                      <span className="font-mono text-white font-medium">{budget.currency}{retainedSurplus > 0 ? retainedSurplus : 180}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#20D2FE] shrink-0" />
                        <span>Emergency</span>
                      </span>
                      <span className="font-mono text-white font-medium">{budget.currency}{emergencyReserve}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#3DDC97] shrink-0" />
                        <span>Saved Amount</span>
                      </span>
                      <span className="font-mono text-white font-medium">{budget.currency}{goalSaved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                        <span>Target Goal</span>
                      </span>
                      <span className="font-mono text-white font-medium">{budget.currency}{targetGoal}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#3DDC97] font-semibold">
                  {targetGoal > 0 ? Math.min(100, Math.round((goalSaved / targetGoal) * 100)) : 0}% Target Saved
                </span>
                <span className="text-[#3DDC97] hover:underline font-semibold flex items-center gap-0.5 text-xs">
                  <span>Manage</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TILE: How to Save Knowledgebase */}
        <div 
          onClick={() => onNavigateTab('how-to-save')}
          className="group relative cursor-pointer md:col-span-2 lg:col-span-2 lg:row-span-1 bg-[#17171D] rounded-[24px] p-5 sm:p-6 border border-white/10 hover:border-[#7C5CFF]/60 hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(124,92,255,0.05)] hover:shadow-[0_8px_25px_rgba(124,92,255,0.2)] flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-[#7C5CFF]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7C5CFF]/20 transition-all" />

          <div className="flex items-center justify-between relative z-10 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#7C5CFF]">Student Survival</span>
            <span className="text-xs text-[#7C5CFF] font-mono bg-[#7C5CFF]/10 px-2.5 py-0.5 rounded-full border border-[#7C5CFF]/20">10 Hacks</span>
          </div>

          <div className="my-2 relative z-10">
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#7C5CFF] transition-colors">
              How to Save Guide
            </h4>
            <p className="text-xs text-[#9A9AA5] mt-1.5 leading-relaxed max-w-lg">
              Cook vs. Eat-Out simulator, campus perks, student software discounts, textbook hacks, and emergency reserve blueprints designed for college students.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#7C5CFF] font-semibold pt-2 relative z-10">
            <span>Explore Campus Saving Hacks</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

      </div>
    </section>
  );
};
