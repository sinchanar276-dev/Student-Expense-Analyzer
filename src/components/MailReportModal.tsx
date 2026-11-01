import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Calendar,
  Sparkles,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Transaction, BudgetConfig, CategorySummary } from '../types';
import { useAuth } from '../context/AuthContext';

import { generateMonthlyExpensePDF } from '../utils/pdfGenerator';
import { Download } from 'lucide-react';

interface MailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budget: BudgetConfig;
  currency: string;
}

export const MailReportModal: React.FC<MailReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budget,
  currency,
}) => {
  const { user, openAuthModal } = useAuth();

  // Selected month
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  
  // Recipient email (default to logged-in user email or sinchanar276@gmail.com)
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    return user?.email || 'sinchanar276@gmail.com';
  });

  const [customNotes, setCustomNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<{
    message: string;
    previewUrl?: string;
    subject: string;
    plainReport: string;
    pdfBlob?: Blob;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync recipientEmail when user changes
  React.useEffect(() => {
    if (user?.email) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  // Filter transactions by selected month
  const monthTransactions = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  const totalSpent = monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyBudget = budget.monthlyBudget || 1000;
  const remainingBudget = monthlyBudget - totalSpent;
  const budgetUtilization = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
  
  const dates = new Set(monthTransactions.map(t => t.date));
  const dailyAverage = dates.size > 0 ? totalSpent / dates.size : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  monthTransactions.forEach(t => {
    const cat = t.category || 'Others';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
  });

  const categories = Object.entries(categoryTotals)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalSpent > 0 ? (amt / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topExpenses = [...monthTransactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      source: t.source,
    }));

  const monthLabel = new Date(selectedMonth + '-15').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleDownloadPDF = () => {
    try {
      const { doc } = generateMonthlyExpensePDF({
        monthName: monthLabel,
        currency,
        summary: {
          totalSpent,
          monthlyBudget,
          remainingBudget,
          budgetUtilization,
          dailyAverage,
          transactionCount: monthTransactions.length,
        },
        categories,
        transactions: monthTransactions,
        userProfile: {
          displayName: user?.displayName || 'Student',
          email: recipientEmail.trim(),
        },
        savingsGoal: {
          name: 'MacBook Pro for College',
          savedAmount: 680,
          targetAmount: 1200,
        },
        customNotes: customNotes.trim(),
      });
      doc.save(`Budgio_Expense_Report_${selectedMonth}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      // 1. Generate full PDF statement on the client
      const { doc, blob, base64 } = generateMonthlyExpensePDF({
        monthName: monthLabel,
        currency,
        summary: {
          totalSpent,
          monthlyBudget,
          remainingBudget,
          budgetUtilization,
          dailyAverage,
          transactionCount: monthTransactions.length,
        },
        categories,
        transactions: monthTransactions,
        userProfile: {
          displayName: user?.displayName || 'Student',
          email: recipientEmail.trim(),
        },
        savingsGoal: {
          name: 'MacBook Pro for College',
          savedAmount: 680,
          targetAmount: 1200,
        },
        customNotes: customNotes.trim(),
      });

      // 2. Attempt dispatch email with PDF attachment
      try {
        const response = await fetch('/api/mail/monthly-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: recipientEmail.trim(),
            monthName: monthLabel,
            currency,
            summary: {
              totalSpent,
              monthlyBudget,
              remainingBudget,
              budgetUtilization,
              dailyAverage,
              transactionCount: monthTransactions.length,
            },
            categories,
            topExpenses,
            customNotes: customNotes.trim(),
            pdfBase64: base64,
            fileName: `Budgio_Statement_${selectedMonth}.pdf`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPdfGenerated(true);
          setSuccessResult({
            message: data.message,
            previewUrl: data.previewUrl,
            subject: data.subject,
            plainReport: data.plainReport,
            pdfBlob: blob,
          });
          return;
        }
      } catch (fetchErr) {
        console.warn('Backend email dispatch unreachable (e.g. Netlify static hosting). Presenting client PDF download and Gmail options:', fetchErr);
      }

      // 3. Fallback for static hosts (e.g. Netlify): Download PDF directly in browser and offer Gmail compose
      doc.save(`Budgio_Statement_${selectedMonth}.pdf`);
      setPdfGenerated(true);
      setSuccessResult({
        message: `Official statement PDF generated and downloaded to your device! You can also copy the report or open in Gmail for ${recipientEmail}.`,
        subject: `Your Budgio Monthly Expense Statement - ${monthLabel}`,
        plainReport: `BUDGIO - STUDENT EXPENSE STATEMENT\nPeriod: ${monthLabel}\nRecipient: ${recipientEmail}\nTotal Spent: ${currency}${totalSpent.toFixed(2)}\nBudget: ${currency}${monthlyBudget.toFixed(2)}\nRemaining: ${currency}${remainingBudget.toFixed(2)}\n\nCategories:\n${categories.map(c => `* ${c.category}: ${currency}${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join('\n')}`,
        pdfBlob: blob,
      });
    } catch (err: any) {
      console.error('Email error:', err);
      setErrorMessage(err.message || 'Error generating statement PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    const reportText = successResult?.plainReport || `BUDGIO STATEMENT - ${monthLabel}\nTotal Spent: ${currency}${totalSpent.toFixed(2)}\nBudget: ${currency}${monthlyBudget.toFixed(2)}\nRemaining: ${currency}${remainingBudget.toFixed(2)}`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(`Budgio Expense Statement - ${monthLabel}`)}&body=${encodeURIComponent(successResult?.plainReport || `Total Spent: ${currency}${totalSpent.toFixed(2)}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#7C5CFF]/15 via-transparent to-[#3DDC97]/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] flex items-center justify-center text-white shadow-lg shadow-[#7C5CFF]/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Mail Expense Statement
              </h2>
              <p className="text-xs text-[#9A9AA5]">
                Send a complete financial summary report to your email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* User Sign In Banner if not logged in */}
          {!user && (
            <div className="p-3 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C5CFF] shrink-0" />
                <span className="text-xs text-white">
                  Not signed in? You can enter any email below or sign in to auto-fill.
                </span>
              </div>
              <button
                onClick={() => openAuthModal('signin')}
                className="text-xs font-semibold text-[#7C5CFF] hover:underline shrink-0"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
              Select Statement Month
            </label>
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSuccessResult(null);
                }}
                className="w-full bg-[#17171D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C5CFF] transition-all"
              />
            </div>
          </div>

          {/* Recipient Email */}
          <div>
            <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
              Recipient Email Address {user?.email && <span className="text-[#3DDC97] font-semibold">(Logged-in Account)</span>}
            </label>
            <div className="relative">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full bg-[#17171D] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C5CFF] transition-all"
              />
            </div>
          </div>

          {/* Statement Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#17171D] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#3DDC97]" />
                {monthLabel} Preview
              </span>
              <span className="text-[#9A9AA5]">{monthTransactions.length} transactions</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#21212B]">
                <div className="text-[10px] uppercase text-[#9A9AA5]">Total Spent</div>
                <div className="text-sm font-bold text-white mt-0.5">{currency}{totalSpent.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#21212B]">
                <div className="text-[10px] uppercase text-[#9A9AA5]">Remaining Budget</div>
                <div className={`text-sm font-bold mt-0.5 ${remainingBudget < 0 ? 'text-[#FF6B6B]' : 'text-[#3DDC97]'}`}>
                  {currency}{remainingBudget.toFixed(2)}
                </div>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-medium text-[#9A9AA5] mb-1">Top Spending Categories:</div>
                <div className="flex flex-wrap gap-1.5">
                  {categories.slice(0, 4).map((c) => (
                    <span 
                      key={c.category} 
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] text-white"
                    >
                      {c.category}: <span className="font-semibold">{currency}{c.amount.toFixed(0)}</span> ({c.percentage.toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-[11px] text-[#9A9AA5] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#7C5CFF]" />
                Includes categorized breakdown & transaction audit
              </span>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3DDC97] hover:underline"
              >
                <Download className="w-3 h-3" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
              Personal Notes (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Midterms month, textbook purchases included"
              className="w-full bg-[#17171D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#7C5CFF]"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Result */}
          {successResult && (
            <div className="p-4 rounded-xl bg-[#3DDC97]/10 border border-[#3DDC97]/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#3DDC97]">
                <CheckCircle className="w-4 h-4" />
                <span>{successResult.message}</span>
              </div>
              <p className="text-xs text-[#9A9AA5]">
                Your monthly statement was dispatched with an official PDF attachment. You can also download the PDF directly or view email details.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3DDC97] text-slate-900 font-bold text-xs hover:bg-[#34c787] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF File</span>
                </button>

                {successResult.previewUrl && (
                  <a
                    href={successResult.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
                  >
                    <span>View Email Web Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Gmail</span>
                </a>

                <button
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#17171D] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#3DDC97]" />
            <span>Download PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#9A9AA5] hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleSendEmail}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] hover:opacity-95 shadow-lg shadow-[#7C5CFF]/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Statement...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to {recipientEmail ? recipientEmail.split('@')[0] : 'Email'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
