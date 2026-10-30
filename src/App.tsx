import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  Transaction, 
  BudgetConfig, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES 
} from './types';
import { SAMPLE_TRANSACTIONS } from './utils/sampleData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AddExpensesView } from './components/AddExpensesView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetPlannerView } from './components/BudgetPlannerView';
import { SpendingInsightsView } from './components/SpendingInsightsView';
import { HowToSaveView } from './components/HowToSaveView';
import { BentoFeatures } from './components/BentoFeatures';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  subscribeToUserTransactions, 
  saveTransactionToCloud, 
  deleteTransactionFromCloud, 
  batchSaveTransactionsToCloud, 
  clearAllTransactionsFromCloud,
  subscribeToUserBudget,
  saveBudgetToCloud
} from './services/firestoreSync';
import { Plus, X, Sparkles, Cloud, CloudCheck, ShieldCheck, LogIn } from 'lucide-react';
import { categorizeDescription } from './utils/categorizer';

const DEFAULT_BUDGET: BudgetConfig = {
  monthlyBudget: 1000.00,
  categoryBudgets: {
    Accommodation: 450,
    Food: 250,
    Education: 120,
    Transport: 70,
    Shopping: 50,
    Entertainment: 40,
    Others: 20,
  },
  currency: '$',
};

function BudgioApp() {
  const { user, openAuthModal } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Dark/Light Mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('sea_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sea_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sea_theme', 'light');
    }
  }, [isDark]);

  // Currency State
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('sea_currency') || '$';
  });

  useEffect(() => {
    localStorage.setItem('sea_currency', currency);
  }, [currency]);

  // Transactions State (Initialized from localStorage or sample)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sea_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    }
    return SAMPLE_TRANSACTIONS;
  });

  // Budget State
  const [budget, setBudget] = useState<BudgetConfig>(() => {
    const saved = localStorage.getItem('sea_budget');
    if (saved) {
      try {
        return { ...DEFAULT_BUDGET, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved budget', e);
      }
    }
    return DEFAULT_BUDGET;
  });

  // Real-time Cloud Synchronization when user logs in with Firebase
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to Cloud Transactions
    const unsubscribeTransactions = subscribeToUserTransactions(user.uid, (cloudTxs) => {
      if (cloudTxs && cloudTxs.length > 0) {
        setTransactions(cloudTxs);
      } else {
        // If cloud collection is currently empty for this user, upload existing initial transactions
        if (transactions.length > 0) {
          batchSaveTransactionsToCloud(user.uid, transactions).catch(console.error);
        }
      }
    });

    // 2. Subscribe to Cloud Budget
    const unsubscribeBudget = subscribeToUserBudget(user.uid, (cloudBudget) => {
      if (cloudBudget) {
        setBudget(cloudBudget);
      }
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeBudget();
    };
  }, [user]);

  // Sync transactions to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem('sea_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Sync budget to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem('sea_budget', JSON.stringify(budget));
  }, [budget]);

  // Update currency inside budget config
  useEffect(() => {
    setBudget(prev => ({ ...prev, currency }));
  }, [currency]);

  // Quick Add Modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState<ExpenseCategory>('Food');
  const [quickSource, setQuickSource] = useState('Debit Card');

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!quickDesc.trim() || isNaN(amt) || amt <= 0) return;

    const newTx: Transaction = {
      id: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString().slice(0, 10),
      description: quickDesc.trim(),
      amount: Math.round(amt * 100) / 100,
      category: quickCategory,
      source: quickSource,
    };

    setTransactions(prev => [newTx, ...prev]);
    if (user) {
      await saveTransactionToCloud(user.uid, newTx);
    }
    setIsQuickAddOpen(false);
    setQuickDesc('');
    setQuickAmount('');
  };

  // Transaction CRUD handlers with Firebase synchronization
  const handleAddTransaction = async (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);
    if (user) {
      await saveTransactionToCloud(user.uid, newTx);
    }
  };

  const handleAddBatchTransactions = async (items: Transaction[]) => {
    setTransactions(prev => [...items, ...prev]);
    if (user) {
      await batchSaveTransactionsToCloud(user.uid, items);
    }
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    if (user) {
      await saveTransactionToCloud(user.uid, updatedTx);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user) {
      await deleteTransactionFromCloud(user.uid, id);
    }
  };

  const handleClearAll = async () => {
    setTransactions([]);
    if (user) {
      await clearAllTransactionsFromCloud(user.uid);
    }
  };

  const handleResetToSample = async () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    if (user) {
      await batchSaveTransactionsToCloud(user.uid, SAMPLE_TRANSACTIONS);
    }
  };

  const handleUpdateBudget = async (newBudget: BudgetConfig) => {
    setBudget(newBudget);
    if (user) {
      await saveBudgetToCloud(user.uid, newBudget);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden w-full ${
      isDark ? 'bg-[#0B0B0F] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Universal 3-Zone Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        isDark={isDark}
        setIsDark={setIsDark}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Cloud Sync Status Strip */}
      <div className="bg-[#121218] border-b border-white/5 py-1.5 px-4 text-[11px] text-[#9A9AA5]">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
              <span className="text-white font-medium">Cloud Active:</span>
              <span className="text-slate-300 truncate max-w-[200px] sm:max-w-none">{user.email}</span>
              <span className="hidden sm:inline text-xs text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/25">
                student-expense-analyzer
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Offline Mode (Local Storage)</span>
              <span className="hidden sm:inline">· Sign in to sync your expenses with Firebase</span>
            </div>
          )}

          {!user && (
            <button
              onClick={() => openAuthModal('signin')}
              className="text-[#7C5CFF] hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Sign In / Sign Up</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 lg:pb-16 overflow-x-hidden">
        
        {/* Render Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <DashboardView
              transactions={transactions}
              budget={budget}
              onNavigateTab={setActiveTab}
              onAddExpense={() => setActiveTab('add-expenses')}
            />

            {/* Bento Grid Features Section per specification */}
            <div className="pt-6 border-t border-white/10">
              <BentoFeatures
                transactions={transactions}
                budget={budget}
                onNavigateTab={setActiveTab}
              />
            </div>
          </div>
        )}

        {activeTab === 'add-expenses' && (
          <AddExpensesView
            onAddTransaction={handleAddTransaction}
            onAddBatchTransactions={handleAddBatchTransactions}
            currency={currency}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAll={handleClearAll}
            onResetToSample={handleResetToSample}
            currency={currency}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'budget-planner' && (
          <BudgetPlannerView
            budget={budget}
            onUpdateBudget={handleUpdateBudget}
            transactions={transactions}
            currency={currency}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'spending-insights' && (
          <SpendingInsightsView
            transactions={transactions}
            budget={budget}
            currency={currency}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'how-to-save' && (
          <HowToSaveView
            currency={currency}
            onNavigateTab={setActiveTab}
          />
        )}
      </main>

      {/* Global Quick Add Expense Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#17171D] border border-white/10 rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Plus className="w-4 h-4 text-[#7C5CFF]" />
                <span>Quick Log Expense</span>
              </div>
              <button 
                onClick={() => setIsQuickAddOpen(false)}
                className="text-[#9A9AA5] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus iced mocha, Subway ticket, Amazon notebook..."
                  value={quickDesc}
                  onChange={(e) => {
                    const desc = e.target.value;
                    setQuickDesc(desc);
                    if (desc.trim().length > 2) {
                      setQuickCategory(categorizeDescription(desc));
                    }
                  }}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7C5CFF]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9A9AA5] mb-1 font-medium">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#9A9AA5] mb-1 font-medium">Category</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Payment Source</label>
                <select
                  value={quickSource}
                  onChange={(e) => setQuickSource(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
                >
                  <option value="Debit Card">Debit Card</option>
                  <option value="Campus Card">Campus Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 text-[#9A9AA5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Auth Modal for Sign In & Sign Up */}
      <AuthModal />

      {/* Quiet, Minimalist Footer */}
      <footer className="border-t border-white/10 bg-[#0B0B0F]/80 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9A9AA5]">
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/aistudio/image_05f63413.png" 
              alt="Budgio Icon" 
              className="w-5 h-5 rounded-md object-cover border border-white/10" 
            />
            <span className="font-bold text-white">Budgio</span>
            <span>·</span>
            <span>Student Expense Analyzer</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#3DDC97] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Firebase Connected</span>
            </span>
            <span>·</span>
            <button 
              onClick={() => setActiveTab('how-to-save')}
              className="text-[#3DDC97] hover:underline"
            >
              Saving Rules
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BudgioApp />
    </AuthProvider>
  );
}
