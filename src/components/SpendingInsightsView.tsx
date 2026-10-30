import React, { useMemo } from 'react';
import { 
  Lightbulb, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Coffee, 
  ShoppingBag, 
  Tv, 
  ArrowRight, 
  Target, 
  Compass, 
  CalendarDays,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';
import { Transaction, BudgetConfig, ExpenseCategory, CATEGORY_COLORS } from '../types';

interface SpendingInsightsViewProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  currency: string;
  onNavigateTab: (tab: any) => void;
}

export const SpendingInsightsView: React.FC<SpendingInsightsViewProps> = ({
  transactions,
  budget,
  currency,
  onNavigateTab,
}) => {
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);

  // Group by category
  const categoryTotals = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
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
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [transactions]);

  // Identify highest category
  const sortedCategories = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([cat, amt]) => ({
        category: cat as ExpenseCategory,
        amount: amt,
        percentage: totalSpent > 0 ? (amt / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [categoryTotals, totalSpent]);

  const topCategory = sortedCategories[0];

  // Micro-transaction analysis (e.g. coffee, snacks, small orders < $15)
  const microTransactions = useMemo(() => {
    return transactions.filter(t => t.amount <= 15 && (t.category === 'Food' || t.category === 'Entertainment'));
  }, [transactions]);

  const microTotal = microTransactions.reduce((s, t) => s + t.amount, 0);

  // Weekend vs Weekday analysis
  const dayAnalysis = useMemo(() => {
    let weekendTotal = 0;
    let weekendCount = 0;
    let weekdayTotal = 0;
    let weekdayCount = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      const day = d.getDay(); // 0 is Sunday, 6 is Saturday
      if (day === 0 || day === 6) {
        weekendTotal += t.amount;
        weekendCount++;
      } else {
        weekdayTotal += t.amount;
        weekdayCount++;
      }
    });

    return {
      weekendTotal,
      weekendCount,
      weekdayTotal,
      weekdayCount,
      weekendAvg: weekendCount > 0 ? weekendTotal / weekendCount : 0,
      weekdayAvg: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
    };
  }, [transactions]);

  // 50/30/20 Rule Estimation for Student Life
  // Needs: Accommodation, Education, 70% of Food, 80% of Transport
  // Wants: 30% of Food (cafes, takeout), 20% of Transport (cabs), Shopping, Entertainment, Others
  const needsSpent = 
    categoryTotals.Accommodation + 
    categoryTotals.Education + 
    categoryTotals.Food * 0.65 + 
    categoryTotals.Transport * 0.70;
  
  const wantsSpent = 
    categoryTotals.Food * 0.35 + 
    categoryTotals.Transport * 0.30 + 
    categoryTotals.Shopping + 
    categoryTotals.Entertainment + 
    categoryTotals.Others;

  const needsPercent = totalSpent > 0 ? Math.round((needsSpent / totalSpent) * 100) : 0;
  const wantsPercent = totalSpent > 0 ? Math.round((wantsSpent / totalSpent) * 100) : 0;

  // Potential Monthly Savings Recommendations
  const savingOpportunities = useMemo(() => {
    const list: {
      title: string;
      category: ExpenseCategory;
      potentialMonthlySavings: number;
      action: string;
      difficulty: 'Easy' | 'Medium' | 'Challenging';
    }[] = [];

    if (categoryTotals.Food > 150) {
      list.push({
        title: 'Batch Cooking & Packing Campus Lunches',
        category: 'Food',
        potentialMonthlySavings: Math.round(categoryTotals.Food * 0.28),
        action: 'Packing 3 homemade lunches per week instead of dining hall / cafe takeout saves ~$30-$45 every week.',
        difficulty: 'Easy',
      });
    }

    if (categoryTotals.Entertainment > 30) {
      list.push({
        title: 'Student Discount Audit & Subscription Sharing',
        category: 'Entertainment',
        potentialMonthlySavings: Math.min(25, Math.round(categoryTotals.Entertainment * 0.40)),
        action: 'Leverage Spotify Student bundle (with Hulu), share family streaming plans, or use university library Kanopy.',
        difficulty: 'Easy',
      });
    }

    if (categoryTotals.Shopping > 60) {
      list.push({
        title: 'Apply 72-Hour Wishlist Rule for Online Orders',
        category: 'Shopping',
        potentialMonthlySavings: Math.round(categoryTotals.Shopping * 0.35),
        action: 'Place non-essential Amazon/Target items in a 72-hour delay cart. Over 30% of student impulse buys fade upon review.',
        difficulty: 'Medium',
      });
    }

    if (categoryTotals.Transport > 40) {
      list.push({
        title: 'Optimize Rideshare vs Campus Transit',
        category: 'Transport',
        potentialMonthlySavings: Math.round(categoryTotals.Transport * 0.30),
        action: 'Reserve Uber/Lyft strictly for emergencies or split with study peers. Take campus shuttles for routine commuting.',
        difficulty: 'Easy',
      });
    }

    return list;
  }, [categoryTotals]);

  const totalPotentialSavings = savingOpportunities.reduce((s, o) => s + o.potentialMonthlySavings, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121218] p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-[#7C5CFF]" />
            <span>Spending Insights & Intelligence</span>
          </h1>
          <p className="text-xs text-[#9A9AA5] mt-1">
            Data-driven patterns, habit audits, and actionable leak detectors calculated from your ledger.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('how-to-save')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3DDC97] bg-[#3DDC97]/10 border border-[#3DDC97]/30 hover:bg-[#3DDC97]/20 transition-all self-start md:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Student Saving Playbook</span>
        </button>
      </div>

      {/* Hero Opportunity Card */}
      <div className="bg-gradient-to-r from-[#17171D] via-[#1A1A24] to-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-[#7C5CFF]/30 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC97]">
              <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
              <span>Diagnostic Opportunity Analysis</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              You could save approximately {currency}{totalPotentialSavings.toFixed(0)} every month
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9A9AA5] leading-relaxed">
              Based on your actual {transactions.length} transactions, reducing cafe trips, optimizing streaming discounts, and pacing impulse shopping can preserve valuable emergency savings without sacrificing campus life.
            </p>
          </div>

          <div className="bg-[#0B0B0F]/90 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-white/10 text-center w-full md:w-auto md:shrink-0 md:min-w-[200px]">
            <span className="text-[10px] sm:text-[11px] text-[#9A9AA5] uppercase tracking-wider font-semibold">Semester Impact</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#3DDC97] my-0.5 sm:my-1">
              {currency}{(totalPotentialSavings * 4).toFixed(0)}
            </div>
            <span className="text-[10px] text-slate-300">4-Month Term Savings</span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Pattern Diagnosis Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Tile 1: Top Category Impact */}
        <div className="bg-[#17171D] p-3.5 sm:p-5 rounded-2xl sm:rounded-[22px] border border-white/10 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9A9AA5]">
            <span className="font-semibold text-white">Dominant Pillar</span>
            <Zap className="w-4 h-4 text-[#FF6B6B]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {topCategory ? topCategory.category : 'N/A'}
            </div>
            <p className="text-xs text-[#FF6B6B] font-mono mt-0.5">
              {topCategory ? `${topCategory.percentage.toFixed(1)}% of all spending` : 'No data'}
            </p>
          </div>
          <p className="text-[11px] text-[#9A9AA5] leading-relaxed">
            {topCategory?.category === 'Food'
              ? 'Food is your heaviest expense. Dining hall extras and cafe coffees add up fastest.'
              : topCategory?.category === 'Accommodation'
              ? 'Rent and dorm utilities are fixed costs. Ensure your roommates pay electric bills on time.'
              : 'Keep an eye on this pillar to avoid mid-semester budget crunches.'}
          </p>
        </div>

        {/* Tile 2: Micro-Transactions Audit */}
        <div className="bg-[#17171D] p-5 rounded-[22px] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9A9AA5]">
            <span className="font-semibold text-white">Micro-Spend Habit (&le;{currency}15)</span>
            <Coffee className="w-4 h-4 text-[#FBBF24]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {currency}{microTotal.toFixed(2)}
            </div>
            <p className="text-xs text-[#FBBF24] font-medium mt-0.5">
              Across {microTransactions.length} snack & drink orders
            </p>
          </div>
          <p className="text-[11px] text-[#9A9AA5] leading-relaxed">
            Quick {currency}4 to {currency}8 coffee runs feel harmless day-to-day, but represent {totalSpent > 0 ? Math.round((microTotal / totalSpent) * 100) : 0}% of your total budget.
          </p>
        </div>

        {/* Tile 3: Weekend vs Weekday Pace */}
        <div className="bg-[#17171D] p-5 rounded-[22px] border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#9A9AA5]">
            <span className="font-semibold text-white">Weekend vs Weekdays</span>
            <CalendarDays className="w-4 h-4 text-[#7C5CFF]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {currency}{dayAnalysis.weekendAvg.toFixed(2)} <span className="text-xs text-[#9A9AA5] font-normal">/ weekend day</span>
            </div>
            <p className="text-xs text-[#7C5CFF] font-medium mt-0.5">
              vs {currency}{dayAnalysis.weekdayAvg.toFixed(2)} weekday average
            </p>
          </div>
          <p className="text-[11px] text-[#9A9AA5] leading-relaxed">
            {dayAnalysis.weekendAvg > dayAnalysis.weekdayAvg * 1.3
              ? 'Weekend outings cause notable spend spikes. Setting a dedicated weekend entertainment cap helps.'
              : 'Balanced cadence between class days and weekends.'}
          </p>
        </div>

      </div>

      {/* Student 50/30/20 Distribution Analysis */}
      <div className="bg-[#17171D] p-6 md:p-8 rounded-[24px] border border-white/10 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-[#3DDC97]" />
            <span>Student Needs vs Wants Breakdown</span>
          </h3>
          <p className="text-xs text-[#9A9AA5] mt-0.5">
            Compare your spending against the classic college guideline: 50% Essentials (Needs), 30% Lifestyle (Wants), and 20% Savings/Buffer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white font-semibold">1. Needs (Dorm, Groceries, Tuition, Transit)</span>
                <span className="font-mono text-[#3DDC97] font-bold">{needsPercent}%</span>
              </div>
              <div className="w-full bg-[#0B0B0F] h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-[#3DDC97] rounded-full transition-all" 
                  style={{ width: `${Math.min(100, needsPercent)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#9A9AA5] mt-1">
                <span>Actual: {currency}{needsSpent.toFixed(2)}</span>
                <span>Ideal Target: ~50%</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white font-semibold">2. Wants (Dining Out, Shopping, Entertainment)</span>
                <span className="font-mono text-[#7C5CFF] font-bold">{wantsPercent}%</span>
              </div>
              <div className="w-full bg-[#0B0B0F] h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-[#7C5CFF] rounded-full transition-all" 
                  style={{ width: `${Math.min(100, wantsPercent)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#9A9AA5] mt-1">
                <span>Actual: {currency}{wantsSpent.toFixed(2)}</span>
                <span>Ideal Target: &le;30%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0B0B0F] rounded-2xl border border-white/10 flex flex-col justify-between text-xs space-y-3">
            <div>
              <h4 className="font-bold text-white mb-1">Campus Financial Health Verdict</h4>
              <p className="text-[#9A9AA5] leading-relaxed">
                {wantsPercent > 35
                  ? `Your lifestyle discretionary spending (${wantsPercent}%) is higher than the recommended 30% threshold. Shifting even 5-10% toward your emergency buffer will prevent end-of-term stress.`
                  : `Well balanced! Your needs account for ${needsPercent}% and wants remain disciplined at ${wantsPercent}%. You have room to maintain a solid cash buffer.`}
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[#9A9AA5]">Remaining Buffer:</span>
              <span className="font-mono font-bold text-white text-sm">
                {currency}{Math.max(0, budget.monthlyBudget - totalSpent).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Action Opportunities */}
      <div className="bg-[#17171D] p-6 md:p-8 rounded-[24px] border border-white/10 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#3DDC97]" />
            <span>High-Impact Student Saving Recommendations</span>
          </h3>
          <p className="text-xs text-[#9A9AA5] mt-0.5">
            Concrete adjustments based on where your money actually went this cycle.
          </p>
        </div>

        {savingOpportunities.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9A9AA5]">
            Add more expense entries to receive personalized recommendations.
          </div>
        ) : (
          <div className="space-y-3">
            {savingOpportunities.map((opp, idx) => {
              const catColor = CATEGORY_COLORS[opp.category] || CATEGORY_COLORS['Others'];
              return (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-[#0B0B0F] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: catColor.light, color: catColor.primary }}
                      >
                        {opp.category}
                      </span>
                      <h4 className="text-xs font-bold text-white">{opp.title}</h4>
                      <span className="text-[10px] text-[#9A9AA5] border border-white/10 px-1.5 py-0.5 rounded">
                        {opp.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-[#9A9AA5]">{opp.action}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#9A9AA5]">Potential Savings</span>
                    <div className="font-mono font-bold text-sm text-[#3DDC97]">
                      +{currency}{opp.potentialMonthlySavings}/mo
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
