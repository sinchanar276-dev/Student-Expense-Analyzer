import React from 'react';
import { 
  PieChart, 
  ReceiptText, 
  Plus, 
  Wallet, 
  TrendingUp, 
  Lightbulb, 
  BookOpen
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onQuickAdd,
}) => {
  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0B0B0F]/95 dark:bg-[#0B0B0F]/95 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] select-none"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'dashboard'
              ? 'text-[#3DDC97] font-semibold'
              : 'text-[#9A9AA5] hover:text-white'
          }`}
        >
          <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-[#3DDC97]' : ''}`} />
          <span className="text-[10px] tracking-tight">Overview</span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'transactions'
              ? 'text-[#3DDC97] font-semibold'
              : 'text-[#9A9AA5] hover:text-white'
          }`}
        >
          <ReceiptText className={`w-5 h-5 transition-transform ${activeTab === 'transactions' ? 'scale-110 text-[#3DDC97]' : ''}`} />
          <span className="text-[10px] tracking-tight">Ledger</span>
        </button>

        {/* Tab 3: Center Elevated Add Button */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            onClick={() => setActiveTab('add-expenses')}
            aria-label="Add Expense"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] text-white flex items-center justify-center shadow-[0_0_20px_rgba(61,220,151,0.45)] hover:shadow-[0_0_25px_rgba(124,92,255,0.6)] active:scale-95 transition-all border-2 border-[#0B0B0F]"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Predictor */}
        <button
          onClick={() => setActiveTab('expense-predictor')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'expense-predictor'
              ? 'text-[#7C5CFF] font-semibold'
              : 'text-[#9A9AA5] hover:text-white'
          }`}
        >
          <TrendingUp className={`w-5 h-5 transition-transform ${activeTab === 'expense-predictor' ? 'scale-110 text-[#7C5CFF]' : ''}`} />
          <span className="text-[10px] tracking-tight flex items-center gap-0.5">
            Predict
          </span>
        </button>

        {/* Tab 5: Budget */}
        <button
          onClick={() => setActiveTab('budget-planner')}
          className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'budget-planner'
              ? 'text-[#3DDC97] font-semibold'
              : 'text-[#9A9AA5] hover:text-white'
          }`}
        >
          <Wallet className={`w-5 h-5 transition-transform ${activeTab === 'budget-planner' ? 'scale-110 text-[#3DDC97]' : ''}`} />
          <span className="text-[10px] tracking-tight">Budget</span>
        </button>

      </div>
    </nav>
  );
};
