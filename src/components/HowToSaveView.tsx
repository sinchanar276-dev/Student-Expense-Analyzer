import React, { useState } from 'react';
import { 
  PiggyBank, 
  UtensilsCrossed, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Check, 
  ChevronRight,
  TrendingDown,
  Percent,
  Coins,
  Calculator,
  Gift
} from 'lucide-react';

interface HowToSaveViewProps {
  currency: string;
  onNavigateTab: (tab: any) => void;
}

export const HowToSaveView: React.FC<HowToSaveViewProps> = ({
  currency,
  onNavigateTab,
}) => {
  // Cook vs Eat Out Calculator State
  const [takeoutMealsPerWeek, setTakeoutMealsPerWeek] = useState<number>(4);
  const [avgTakeoutCost, setAvgTakeoutCost] = useState<number>(14);
  const [avgCookCost, setAvgCookCost] = useState<number>(4);

  const weeklyTakeoutSpent = takeoutMealsPerWeek * avgTakeoutCost;
  const weeklyCookSpent = takeoutMealsPerWeek * avgCookCost;
  const weeklySaved = Math.max(0, weeklyTakeoutSpent - weeklyCookSpent);
  const monthlySaved = weeklySaved * 4.33;
  const semesterSaved = weeklySaved * 16; // 16 week semester

  // Student Emergency Fund Goal Tracker
  const [currentFund, setCurrentFund] = useState<number>(180);
  const fundGoal = 500;
  const fundPercent = Math.min(100, Math.round((currentFund / fundGoal) * 100));

  const STUDENT_RULES = [
    {
      number: '01',
      title: 'Always Flash Your Student ID / .edu Email',
      desc: 'Never pay full price for software, entertainment, or hardware. Use UNiDAYS, Student Beans, Spotify Student ($5.99 bundle with Hulu), GitHub Student Developer Pack, and 10-15% student discounts at local eateries and retail.',
      badge: 'Immediate Discounts',
    },
    {
      number: '02',
      title: 'Never Buy New Textbooks at the Campus Store',
      desc: 'Check your university library course reserves first—professors frequently place textbooks on 2-hour free loan. Rent digital editions on Chegg or VitalSource, buy second-hand on campus buy/sell groups, or use OpenStax.',
      badge: 'Save $200-$400/term',
    },
    {
      number: '03',
      title: 'The "Batch Cook 3 Extra Dinners" Rule',
      desc: 'Cooking just 3 dinners in bulk on Sunday and packing leftovers eliminates high cafeteria surcharges and delivery fees. Keeps your monthly food spend under control without cooking every night.',
      badge: 'Save ~$150/mo',
    },
    {
      number: '04',
      title: 'Claim All Perks Already Paid by Tuition',
      desc: 'Your student fees already pay for campus recreation gym passes, free Microsoft Office 365, MATLAB/Adobe licenses, free university bus shuttles, career counseling, and campus tutoring. Stop paying commercial memberships.',
      badge: 'Zero Added Cost',
    },
    {
      number: '05',
      title: 'The 72-Hour Online Cart Delay Rule',
      desc: 'For any non-essential online purchase (clothes, tech gadgets, room decor), add it to your wishlist and wait 72 hours. Psychological studies show that over 65% of college impulse buys lose their appeal within 3 days.',
      badge: 'Habit Hack',
    },
    {
      number: '06',
      title: 'Cold Brew & Coffee Station in Your Dorm',
      desc: 'A $5.50 daily cafe iced latte totals ~$165/month (~$1,980/year!). A simple French press or cold brew pitcher costs under $20 and delivers barista-quality coffee for $0.40 a serving.',
      badge: 'Save >$1,200/yr',
    },
    {
      number: '07',
      title: 'Audit & Split Subscriptions with Roommates',
      desc: 'Pool family streaming plans, share Costco/Sam\'s Club warehouse memberships for bulk toilet paper and pantry staples, and divide apartment WiFi bills immediately via split apps.',
      badge: 'Collaborative',
    },
    {
      number: '08',
      title: 'Never Incur Bank or ATM Fees',
      desc: 'Switch to zero-fee student checking accounts with no minimum balances and no monthly maintenance fees. Always use in-network campus ATMs to avoid $3-$5 surcharge fees.',
      badge: 'Fee Protection',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121218] p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-[#3DDC97]" />
            <span>How to Save: College Financial Survival Guide</span>
          </h1>
          <p className="text-xs text-[#9A9AA5] mt-1">
            Proven campus budgeting strategies, meal prep simulators, and student discount checklists.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('budget-planner')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] transition-all self-start md:self-auto shadow-sm"
        >
          <span>Update My Monthly Budget</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Tool 1: "Cook at Home vs Campus Takeout" Calculator */}
      <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC97]">
          <Calculator className="w-4 h-4 text-[#7C5CFF]" />
          <span>Interactive Simulator</span>
        </div>
        
        <div>
          <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
            Campus Dining Out vs. Meal Prep Calculator
          </h2>
          <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
            Slide the sliders below to see how swapping just a few takeout lunches for meal-prepped alternatives multiplies your savings over a single semester.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          
          {/* Controls (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-[#0B0B0F] p-4 sm:p-5 rounded-2xl border border-white/10">
            {/* Slider 1: Meals per week */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#9A9AA5] font-medium">Meals Swapped to Home-Cooked / Week:</span>
                <span className="font-mono text-white font-bold text-sm bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {takeoutMealsPerWeek} meals/week
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={takeoutMealsPerWeek}
                onChange={(e) => setTakeoutMealsPerWeek(parseInt(e.target.value, 10))}
                className="w-full accent-[#7C5CFF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#9A9AA5] mt-1">
                <span>1 meal (light change)</span>
                <span>7 meals (1/day)</span>
                <span>14 meals (2/day)</span>
              </div>
            </div>

            {/* Slider 2: Average Takeout Cost */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#9A9AA5] font-medium">Average Takeout / Dining Out Price:</span>
                <span className="font-mono text-[#FF6B6B] font-bold text-sm bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {currency}{avgTakeoutCost}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="30"
                value={avgTakeoutCost}
                onChange={(e) => setAvgTakeoutCost(parseInt(e.target.value, 10))}
                className="w-full accent-[#FF6B6B] cursor-pointer"
              />
            </div>

            {/* Slider 3: Average Cooked Cost */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#9A9AA5] font-medium">Estimated Grocery Cost per Meal:</span>
                <span className="font-mono text-[#3DDC97] font-bold text-sm bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {currency}{avgCookCost}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                value={avgCookCost}
                onChange={(e) => setAvgCookCost(parseInt(e.target.value, 10))}
                className="w-full accent-[#3DDC97] cursor-pointer"
              />
            </div>
          </div>

          {/* Result Card (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#121218] to-[#1A1A24] p-6 rounded-2xl border border-[#3DDC97]/40 text-center space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3DDC97]">
              Projected Student Cash Pocketed
            </span>

            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold font-mono text-white tracking-tight">
                {currency}{monthlySaved.toFixed(0)}
                <span className="text-xs text-[#9A9AA5] font-normal"> / month</span>
              </div>
              <p className="text-xs text-[#3DDC97] font-semibold">
                {currency}{semesterSaved.toFixed(0)} saved over 1 semester
              </p>
            </div>

            <p className="text-[11px] text-[#9A9AA5] leading-relaxed">
              By replacing {takeoutMealsPerWeek} meals each week with grocery meal prep, you retain over {currency}{semesterSaved.toFixed(0)} in your bank account for tuition, travel, or savings.
            </p>
          </div>

        </div>
      </div>

      {/* Interactive Tool 2: Student $500 Emergency Cushion Goal */}
      <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7C5CFF] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Milestone</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              The {currency}500 Student Emergency Fund Cushion
            </h3>
            <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
              Financial advisors recommend every college student maintain at least {currency}500 in an untouched buffer for unexpected laptop repairs, doctor visits, or urgent travel home.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0B0F] p-2 rounded-xl border border-white/10 self-start sm:self-auto">
            <span className="text-xs text-[#9A9AA5] pl-1">Saved:</span>
            <div className="relative w-28">
              <span className="absolute left-2.5 top-1.5 text-xs text-[#9A9AA5] font-mono">{currency}</span>
              <input
                type="number"
                min="0"
                max="2000"
                value={currentFund}
                onChange={(e) => setCurrentFund(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#17171D] border border-white/10 rounded-lg pl-6 pr-2 py-1 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#7C5CFF]"
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-white font-semibold">Current Buffer Progress ({fundPercent}%)</span>
            <span className="font-mono text-[#3DDC97]">{currency}{currentFund.toFixed(0)} / {currency}{fundGoal}</span>
          </div>

          <div className="w-full bg-[#0B0B0F] h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] rounded-full transition-all duration-500"
              style={{ width: `${fundPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] sm:text-[11px] text-[#9A9AA5]">
            <span>{fundGoal - currentFund > 0 ? `${currency}${(fundGoal - currentFund).toFixed(0)} remaining` : 'Goal achieved!'}</span>
            <span>Milestone: {currency}{fundGoal}</span>
          </div>
        </div>
      </div>

      {/* 8 Golden Student Money Rules */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#3DDC97]" />
            <span>8 Essential Campus Financial Rules</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
            Practical, non-restrictive money habits designed specifically for university students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {STUDENT_RULES.map((rule) => (
            <div 
              key={rule.number}
              className="bg-[#17171D] p-4 sm:p-5 rounded-2xl sm:rounded-[22px] border border-white/10 hover:border-[#7C5CFF]/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-0.5 rounded-md border border-[#7C5CFF]/30">
                  {rule.number}
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#3DDC97] bg-[#3DDC97]/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-[#3DDC97]/20">
                  {rule.badge}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white tracking-tight">{rule.title}</h4>
              <p className="text-xs text-[#9A9AA5] leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
