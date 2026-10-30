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
import { ExpensePredictorView } from './components/ExpensePredictorView';
import { FinancialChatbot } from './components/FinancialChatbot';
import { MailReportModal } from './components/MailReportModal';
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
import { 
  Plus, 
  X, 
  Sparkles, 
  Cloud, 
  CloudCheck, 
  ShieldCheck, 
  LogIn, 
  AlertTriangle, 
  Mail, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { categorizeDescription } from './utils/categorizer';
import { generateBudgetWarningPDF } from './utils/pdfGenerator';

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

  // AI Chat & Mail Report Modals
  const [isMailModalOpen, setIsMailModalOpen] = useState<boolean>(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState<boolean>(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');

  const handleOpenChat = (prompt?: string) => {
    if (prompt) setChatInitialPrompt(prompt);
    setIsChatDrawerOpen(true);
  };

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

  // Automated Budget Overrun Monitoring & Email Dispatch
  const totalSpent = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const monthlyBudget = budget.monthlyBudget || 1000;
  const isOverBudget = totalSpent > monthlyBudget;
  const overrunAmount = isOverBudget ? totalSpent - monthlyBudget : 0;
  const budgetUtilization = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

  const [warningAlertState, setWarningAlertState] = useState<{
    dispatched: boolean;
    email: string;
    overrun: number;
    time: string;
    dismissed: boolean;
  }>({
    dispatched: false,
    email: user?.email || 'sinchanar276@gmail.com',
    overrun: 0,
    time: '',
    dismissed: false,
  });

  const [isSendingWarning, setIsSendingWarning] = useState(false);

  // Function to dispatch budget warning email with PDF attachment
  const triggerBudgetWarningEmail = async (force: boolean = false) => {
    if (!isOverBudget && !force) return;
    const recipient = user?.email || 'sinchanar276@gmail.com';
    const overrun = Math.max(0.01, totalSpent - monthlyBudget);
    const sessionDedupeKey = `budgio_alert_sent_${recipient}_${Math.floor(totalSpent / 25)}`;

    if (!force && sessionStorage.getItem(sessionDedupeKey)) {
      return; // Already sent for this spend tier
    }

    setIsSendingWarning(true);
    try {
      const topExpenses = [...transactions].sort((a, b) => b.amount - a.amount).slice(0, 10);
      const { base64, doc } = generateBudgetWarningPDF({
        currency,
        monthlyBudget,
        totalSpent,
        overrunAmount: overrun,
        budgetUtilization,
        userProfile: {
          displayName: user?.displayName || 'Student',
          email: recipient,
        },
        topExpenses,
        alertDate: new Date().toLocaleString(),
      });

      const res = await fetch('/api/mail/budget-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: recipient,
          currency,
          monthlyBudget,
          totalSpent,
          overrunAmount: overrun,
          budgetUtilization,
          userProfile: {
            displayName: user?.displayName || 'Student',
            email: recipient,
          },
          topExpenses,
          pdfBase64: base64,
        }),
      });

      if (res.ok) {
        sessionStorage.setItem(sessionDedupeKey, 'sent');
        setWarningAlertState({
          dispatched: true,
          email: recipient,
          overrun,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dismissed: false,
        });
      }
    } catch (err) {
      console.error('Error dispatching budget warning email:', err);
    } finally {
      setIsSendingWarning(false);
    }
  };

  // Automatic trigger on budget threshold crossing
  useEffect(() => {
    if (isOverBudget && transactions.length > 0) {
      triggerBudgetWarningEmail(false);
    }
  }, [isOverBudget, totalSpent, monthlyBudget]);

  const handleDownloadWarningPDF = () => {
    const topExpenses = [...transactions].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const { doc } = generateBudgetWarningPDF({
      currency,
      monthlyBudget,
      totalSpent,
      overrunAmount: Math.max(0.01, totalSpent - monthlyBudget),
      budgetUtilization,
      userProfile: {
        displayName: user?.displayName || 'Student',
        email: user?.email || 'sinchanar276@gmail.com',
      },
      topExpenses,
      alertDate: new Date().toLocaleString(),
    });
    doc.save(`Budgio_Budget_Overrun_Warning_${new Date().toISOString().slice(0, 10)}.pdf`);
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
        onOpenMailModal={() => setIsMailModalOpen(true)}
        onOpenChat={() => handleOpenChat()}
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
        
        {/* AUTOMATED BUDGET OVERRUN ALERT BANNER */}
        {isOverBudget && !warningAlertState.dismissed && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#1C0F14] to-red-950/80 border border-red-500/40 shadow-[0_4px_25px_rgba(239,68,68,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5 shadow-md shadow-red-500/20">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    ⚠️ Budget Limit Exceeded by {currency}{overrunAmount.toFixed(2)}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {budgetUtilization.toFixed(1)}% Used
                  </span>
                  {warningAlertState.dispatched && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Auto-Emailed to {warningAlertState.email} (PDF Attached)
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-200/90 mt-1">
                  You have spent <strong className="text-white font-mono">{currency}{totalSpent.toFixed(2)}</strong> of your <strong className="text-white font-mono">{currency}{monthlyBudget.toFixed(2)}</strong> limit. A warning notification has been dispatched to <strong>{user?.email || 'sinchanar276@gmail.com'}</strong> with a complete audit PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={handleDownloadWarningPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
                title="Download Incident Audit PDF"
              >
                <Download className="w-3.5 h-3.5 text-red-400" />
                <span>Download Warning PDF</span>
              </button>

              <button
                onClick={() => triggerBudgetWarningEmail(true)}
                disabled={isSendingWarning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all disabled:opacity-50 cursor-pointer"
                title="Resend Budget Warning Email with PDF"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isSendingWarning ? 'Dispatching...' : 'Resend Email Alert'}</span>
              </button>

              <button
                onClick={() => setWarningAlertState(prev => ({ ...prev, dismissed: true }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Render Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <DashboardView
              transactions={transactions}
              budget={budget}
              onNavigateTab={setActiveTab}
              onAddExpense={() => setActiveTab('add-expenses')}
              onOpenMailModal={() => setIsMailModalOpen(true)}
              onOpenChat={() => handleOpenChat()}
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

        {activeTab === 'expense-predictor' && (
          <ExpensePredictorView
            transactions={transactions}
            budget={budget}
            currency={currency}
            onOpenChat={handleOpenChat}
            onOpenMailModal={() => setIsMailModalOpen(true)}
          />
        )}

        {activeTab === 'ai-chat' && (
          <div className="py-2">
            <FinancialChatbot
              transactions={transactions}
              budget={budget}
              currency={currency}
              onOpenMailModal={() => setIsMailModalOpen(true)}
            />
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

      {/* Floating AI Financial Assistant Launcher (shows on all views except ai-chat) */}
      {activeTab !== 'ai-chat' && (
        <button
          onClick={() => handleOpenChat()}
          aria-label="Open Budgio AI Advisor"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] text-slate-950 font-black text-xs shadow-[0_4px_25px_rgba(124,92,255,0.45)] hover:shadow-[0_6px_30px_rgba(61,220,151,0.6)] active:scale-95 transition-all cursor-pointer group select-none"
        >
          <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Ask Budgio AI</span>
        </button>
      )}

      {/* Floating Chatbot Assistant Popout */}
      <FinancialChatbot
        transactions={transactions}
        budget={budget}
        currency={currency}
        isFloating={true}
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        initialPrompt={chatInitialPrompt}
        onOpenMailModal={() => setIsMailModalOpen(true)}
      />

      {/* Mail Monthly Expense Report Modal */}
      <MailReportModal
        isOpen={isMailModalOpen}
        onClose={() => setIsMailModalOpen(false)}
        transactions={transactions}
        budget={budget}
        currency={currency}
      />

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
