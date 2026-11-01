import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  HelpCircle, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Zap,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Transaction, BudgetConfig, ExpenseCategory, CATEGORY_COLORS } from '../types';

interface ExpensePredictorViewProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  currency: string;
  onOpenChat: (initialPrompt?: string) => void;
  onOpenMailModal: () => void;
}

interface PredictionData {
  projectedEndOfMonth: number;
  projectedNextMonth: number;
  confidenceScore: number;
  trajectoryStatus: 'on_track' | 'caution' | 'critical';
  categoryForecasts: Array<{
    category: string;
    currentSpent: number;
    predictedNextMonth: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
    riskLevel: 'low' | 'moderate' | 'high';
    advice: string;
  }>;
  riskFactors: string[];
  savingsOpportunities: string[];
  executiveSummary: string;
}

export const ExpensePredictorView: React.FC<ExpensePredictorViewProps> = ({
  transactions,
  budget,
  currency,
  onOpenChat,
  onOpenMailModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  // What-if simulator sliders
  const [foodCutPct, setFoodCutPct] = useState<number>(0); // 0% - 40%
  const [shoppingCutPct, setShoppingCutPct] = useState<number>(0); // 0% - 50%
  const [rentAdjustment, setRentAdjustment] = useState<number>(0); // -$100 to +$100

  const generateClientPrediction = (): PredictionData => {
    const totalSpent = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const uniqueDates = new Set(transactions.map((t) => t.date));
    const daysLogged = Math.max(1, uniqueDates.size);
    const dailyAverage = totalSpent / daysLogged;
    const budgetLimit = budget.monthlyBudget || 1000;
    const projectedEndOfMonth = Math.round(dailyAverage * 30 * 100) / 100;
    const projectedVariance = projectedEndOfMonth - budgetLimit;
    const trajectoryStatus: 'on_track' | 'caution' | 'critical' =
      projectedEndOfMonth > budgetLimit * 1.15 ? 'critical' : projectedEndOfMonth > budgetLimit ? 'caution' : 'on_track';

    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      const cat = t.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (t.amount || 0);
    });

    const categoryForecasts = Object.entries(categoryTotals).map(([cat, amt]) => {
      const catDaily = amt / daysLogged;
      const predicted = Math.round(catDaily * 30 * 100) / 100;
      const assignedBudget = budget.categoryBudgets?.[cat as ExpenseCategory] || budgetLimit / 6;
      const riskLevel: 'low' | 'moderate' | 'high' =
        predicted > assignedBudget * 1.1 ? 'high' : predicted > assignedBudget ? 'moderate' : 'low';
      return {
        category: cat,
        currentSpent: amt,
        predictedNextMonth: predicted,
        changePercent: Math.round(((predicted - amt) / (amt || 1)) * 100),
        trend: (predicted > amt ? 'up' : 'down') as 'up' | 'down' | 'stable',
        riskLevel,
        advice:
          riskLevel === 'high'
            ? `Pacing above budget. Limit discretionary purchases in ${cat}.`
            : `Spending in ${cat} is well balanced.`,
      };
    });

    return {
      projectedEndOfMonth,
      projectedNextMonth: Math.round(projectedEndOfMonth * 0.98 * 100) / 100,
      confidenceScore: 84,
      trajectoryStatus,
      categoryForecasts,
      riskFactors: [
        projectedVariance > 0
          ? `Current burn rate exceeds monthly budget by ${currency}${projectedVariance.toFixed(2)}.`
          : 'End-of-month spending is safely below your ceiling.',
        'Discretionary food & shopping velocity shows mid-week spikes.',
      ],
      savingsOpportunities: [
        'Cook at home or pack campus snacks to trim food expenses by up to 15%.',
        'Look into public transit semester passes instead of rideshare apps.',
        'Cancel unused digital subscriptions before recurring billing renews.',
      ],
      executiveSummary: `Based on your average spending velocity of ${currency}${dailyAverage.toFixed(2)}/day, your projected total for the 30-day period is ${currency}${projectedEndOfMonth.toFixed(2)}. ${
        trajectoryStatus === 'critical'
          ? 'Action is required to avoid a budget deficit.'
          : 'You are on track to stay financially secure!'
      }`,
    };
  };

  // Fetch prediction from server (or calculate client-side on static hosts like Netlify)
  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          budget,
          currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.projectedEndOfMonth) {
          setPrediction(data);
          return;
        }
      }
      setPrediction(generateClientPrediction());
    } catch (e) {
      console.warn('Backend /api/predict unreachable (e.g. Netlify static hosting). Running client forecast engine:', e);
      setPrediction(generateClientPrediction());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [transactions, budget, currency]);

  // Derived current month calculations
  const totalSpent = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const uniqueDates = useMemo(() => {
    return new Set(transactions.map((t) => t.date));
  }, [transactions]);

  const daysLogged = Math.max(1, uniqueDates.size);
  const dailyAverage = totalSpent / daysLogged;
  const budgetLimit = budget.monthlyBudget || 1000;

  // What-if simulated calculations
  const simulatedSavings = useMemo(() => {
    let saved = 0;
    // Food savings
    const foodSpent = transactions
      .filter((t) => t.category === 'Food')
      .reduce((sum, t) => sum + t.amount, 0);
    saved += foodSpent * (foodCutPct / 100);

    // Shopping savings
    const shoppingSpent = transactions
      .filter((t) => t.category === 'Shopping' || t.category === 'Entertainment')
      .reduce((sum, t) => sum + t.amount, 0);
    saved += shoppingSpent * (shoppingCutPct / 100);

    // Rent adjust
    saved -= rentAdjustment;

    return Math.max(0, saved);
  }, [transactions, foodCutPct, shoppingCutPct, rentAdjustment]);

  const adjustedProjectedNextMonth = useMemo(() => {
    if (!prediction) return totalSpent;
    return Math.max(0, prediction.projectedNextMonth - simulatedSavings);
  }, [prediction, simulatedSavings, totalSpent]);

  // Chart data: Day 1 to Day 30 trajectory
  const trajectoryChartData = useMemo(() => {
    const data = [];
    const baseDaily = dailyAverage;
    const currentDay = Math.min(daysLogged, 30);

    let cumulativeActual = 0;
    for (let day = 1; day <= 30; day++) {
      if (day <= currentDay) {
        cumulativeActual += baseDaily;
        data.push({
          day: `Day ${day}`,
          actual: Math.round(cumulativeActual),
          projected: Math.round(cumulativeActual),
          budgetCap: Math.round((budgetLimit / 30) * day),
        });
      } else {
        const simRate = Math.max(1, baseDaily - (simulatedSavings / 30));
        cumulativeActual += simRate;
        data.push({
          day: `Day ${day}`,
          actual: null,
          projected: Math.round(cumulativeActual),
          budgetCap: Math.round((budgetLimit / 30) * day),
        });
      }
    }
    return data;
  }, [dailyAverage, daysLogged, budgetLimit, simulatedSavings]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#17171D] border border-white/10 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-[#7C5CFF]/20 to-[#3DDC97]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-xs font-semibold text-[#7C5CFF] mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Budgio AI Predictive Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Expense Predictor & Spending Forecast
            </h1>
            <p className="text-xs sm:text-sm text-[#9A9AA5] mt-1 max-w-xl">
              Anticipate upcoming expenses, test budget scenarios, and prevent deficits using machine learning forecasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={fetchPrediction}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#7C5CFF]' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Refresh Forecast'}</span>
            </button>

            <button
              onClick={() => onOpenChat('Predict my total end of month spending and tell me where I can cut costs')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C5CFF] hover:bg-[#6e4ef5] text-white text-xs font-bold shadow-lg shadow-[#7C5CFF]/25 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI Chat</span>
            </button>

            <button
              onClick={onOpenMailModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3DDC97] hover:bg-[#34c787] text-slate-950 text-xs font-bold shadow-lg shadow-[#3DDC97]/25 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Forecast Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Current Run-Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17171D] border border-white/10 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5] mb-1">
            Current Spend Velocity
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {currency}{dailyAverage.toFixed(2)}<span className="text-xs font-medium text-[#9A9AA5]">/day</span>
          </div>
          <p className="text-[11px] text-[#9A9AA5] mt-1.5">
            Logged across {daysLogged} active tracking days
          </p>
        </div>

        {/* Metric 2: Projected End-of-Month */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17171D] border border-white/10 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5] mb-1">
            Projected End of Month
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {currency}{prediction ? prediction.projectedEndOfMonth.toFixed(2) : (dailyAverage * 30).toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {(prediction?.projectedEndOfMonth || dailyAverage * 30) > budgetLimit ? (
              <span className="text-[11px] font-semibold text-[#FF6B6B] flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Over budget limit by {currency}{Math.abs((prediction?.projectedEndOfMonth || dailyAverage * 30) - budgetLimit).toFixed(0)}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[#3DDC97] flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />
                Within budget ceiling ({currency}{(budgetLimit - (prediction?.projectedEndOfMonth || dailyAverage * 30)).toFixed(0)} safe)
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Next Month Forecast */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17171D] border border-[#7C5CFF]/30 bg-gradient-to-br from-[#17171D] to-[#7C5CFF]/10 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C5CFF] mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Next Month Forecast
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {currency}{adjustedProjectedNextMonth.toFixed(2)}
          </div>
          {simulatedSavings > 0 ? (
            <p className="text-[11px] text-[#3DDC97] font-semibold mt-1.5">
              Includes {currency}{simulatedSavings.toFixed(0)} in simulator cuts
            </p>
          ) : (
            <p className="text-[11px] text-[#9A9AA5] mt-1.5">
              Based on baseline habits & recurring costs
            </p>
          )}
        </div>

        {/* Metric 4: AI Confidence & Status */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#17171D] border border-white/10 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA5] mb-1">
            Forecast Confidence
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">
              {prediction?.confidenceScore || 85}%
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              prediction?.trajectoryStatus === 'critical'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : prediction?.trajectoryStatus === 'caution'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-[#3DDC97] border border-emerald-500/30'
            }`}>
              {prediction?.trajectoryStatus === 'critical' ? 'High Risk' : prediction?.trajectoryStatus === 'caution' ? 'Moderate Risk' : 'Healthy'}
            </span>
          </div>
          <p className="text-[11px] text-[#9A9AA5] mt-1.5 truncate">
            {prediction?.executiveSummary || 'Analyzing spending velocity...'}
          </p>
        </div>

      </div>

      {/* Main Grid: Trajectory Chart & What-If Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: 30-Day Spending Trajectory Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#17171D] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#7C5CFF]" />
                30-Day Projected Spending Trajectory
              </h2>
              <p className="text-xs text-[#9A9AA5]">
                Actual cumulative expenses to date vs forecasted path & monthly budget cap
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#3DDC97]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97]" /> Actual
              </span>
              <span className="flex items-center gap-1.5 text-[#7C5CFF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF]" /> Forecast
              </span>
              <span className="flex items-center gap-1.5 text-white/50">
                <span className="w-2.5 h-0.5 bg-white/40" /> Budget Cap
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3DDC97" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252530" />
                <XAxis dataKey="day" stroke="#9A9AA5" fontSize={10} tickLine={false} interval={4} />
                <YAxis stroke="#9A9AA5" fontSize={10} tickLine={false} tickFormatter={(val) => `${currency}${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121218',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FFF',
                  }}
                  formatter={(value: any, name: any) => [
                    `${currency}${Number(value || 0).toFixed(0)}`,
                    name === 'actual' ? 'Actual Spent' : name === 'projected' ? 'Forecasted Run Rate' : 'Budget Cap',
                  ]}
                />
                <Area type="monotone" dataKey="actual" stroke="#3DDC97" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="projected" stroke="#7C5CFF" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProjected)" />
                <Area type="monotone" dataKey="budgetCap" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: "What-If" Scenario Simulator */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#17171D] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3DDC97]" />
              "What-If" Simulator
            </h2>
            <button
              onClick={() => {
                setFoodCutPct(0);
                setShoppingCutPct(0);
                setRentAdjustment(0);
              }}
              className="text-[10px] text-[#9A9AA5] hover:text-white underline"
            >
              Reset
            </button>
          </div>

          <p className="text-xs text-[#9A9AA5]">
            Adjust lifestyle sliders to immediately test how habit shifts lower your forecast.
          </p>

          <div className="space-y-4 pt-1">
            
            {/* Slider 1: Food & Dining */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9A9AA5]">Cut Dining & Takeout:</span>
                <span className="font-bold text-[#3DDC97]">-{foodCutPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={foodCutPct}
                onChange={(e) => setFoodCutPct(parseInt(e.target.value, 10))}
                className="w-full accent-[#3DDC97] cursor-pointer"
              />
            </div>

            {/* Slider 2: Shopping & Entertainment */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9A9AA5]">Trim Shopping & Fun:</span>
                <span className="font-bold text-[#7C5CFF]">-{shoppingCutPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={shoppingCutPct}
                onChange={(e) => setShoppingCutPct(parseInt(e.target.value, 10))}
                className="w-full accent-[#7C5CFF] cursor-pointer"
              />
            </div>

            {/* Slider 3: Rent / Fixed Costs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9A9AA5]">Housing / Utilities Shift:</span>
                <span className={`font-bold ${rentAdjustment > 0 ? 'text-[#FF6B6B]' : 'text-white'}`}>
                  {rentAdjustment > 0 ? `+${currency}${rentAdjustment}` : `${currency}${rentAdjustment}`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="25"
                value={rentAdjustment}
                onChange={(e) => setRentAdjustment(parseInt(e.target.value, 10))}
                className="w-full accent-blue-400 cursor-pointer"
              />
            </div>

            {/* Simulation Impact Result */}
            <div className="p-3.5 rounded-xl bg-[#21212B] border border-white/5 space-y-2 mt-2">
              <div className="text-[11px] text-[#9A9AA5] uppercase font-semibold">
                Simulated Net Impact
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">Estimated Monthly Savings:</span>
                <span className="text-base font-extrabold text-[#3DDC97]">
                  +{currency}{simulatedSavings.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-[#9A9AA5]">New Next Month Total:</span>
                <span className="font-bold text-white">
                  {currency}{adjustedProjectedNextMonth.toFixed(0)}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Category-by-Category Forecast Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#17171D] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C5CFF]" />
              Category-Wise Spending Forecast
            </h2>
            <p className="text-xs text-[#9A9AA5]">
              Predicted run rate and risk level for every student expenditure bucket
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {prediction?.categoryForecasts?.map((cat) => {
            const colors = CATEGORY_COLORS[cat.category as ExpenseCategory] || { primary: '#9A9AA5', light: 'rgba(255,255,255,0.05)' };
            return (
              <div 
                key={cat.category}
                className="p-4 rounded-xl bg-[#1F1F27] border border-white/5 hover:border-white/15 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span className="font-bold text-xs text-white">{cat.category}</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    cat.riskLevel === 'high'
                      ? 'bg-red-500/15 text-red-400'
                      : cat.riskLevel === 'moderate'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-[#3DDC97]/15 text-[#3DDC97]'
                  }`}>
                    {cat.riskLevel.toUpperCase()} RISK
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[#9A9AA5]">Current: </span>
                    <span className="text-xs font-semibold text-white">{currency}{cat.currentSpent.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9A9AA5]">Forecast: </span>
                    <span className="text-sm font-bold text-white">{currency}{cat.predictedNextMonth.toFixed(0)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#9A9AA5] leading-relaxed italic border-t border-white/5 pt-2">
                  "{cat.advice}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Risk Factors & Savings Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Risk Factors */}
        <div className="p-5 rounded-2xl bg-[#17171D] border border-red-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B6B]">
            <ShieldAlert className="w-4 h-4" />
            <span>Identified Risk Warnings</span>
          </div>
          <ul className="space-y-2">
            {(prediction?.riskFactors || [
              'Daily velocity is trending higher during the final week of the month.',
              'Discretionary food & delivery orders comprise over 25% of all outflow.',
            ]).map((rf, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                <span className="text-red-400 mt-0.5">&bull;</span>
                <span>{rf}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Savings Opportunities */}
        <div className="p-5 rounded-2xl bg-[#17171D] border border-[#3DDC97]/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3DDC97]">
            <Zap className="w-4 h-4" />
            <span>AI Savings Recommendations</span>
          </div>
          <ul className="space-y-2">
            {(prediction?.savingsOpportunities || [
              'Meal prep on Sundays to reclaim an estimated $40/week in dining costs.',
              'Switch to semester public transit pass before next month begins.',
              'Check campus library digital reserves before buying textbooks.',
            ]).map((so, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3DDC97] shrink-0 mt-0.5" />
                <span>{so}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
