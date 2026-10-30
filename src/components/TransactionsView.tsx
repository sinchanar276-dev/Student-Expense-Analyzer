import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  ArrowUpDown, 
  Plus, 
  Calendar,
  X,
  Check,
  RotateCcw,
  ReceiptText,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Transaction, ExpenseCategory, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../types';
import { exportTransactionsToCSV, downloadSampleCSV } from '../utils/sampleData';

interface TransactionsViewProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onClearAll: () => void;
  onResetToSample: () => void;
  currency: string;
  onNavigateTab: (tab: any) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onClearAll,
  onResetToSample,
  currency,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  // Modals state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Available sources from transactions
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.source) set.add(t.source);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
        const matchesSource = selectedSource === 'All' || t.source === selectedSource;
        return matchesSearch && matchesCategory && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchTerm, selectedCategory, selectedSource, sortBy]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    if (editingTransaction.amount <= 0 || !editingTransaction.description.trim()) return;

    onUpdateTransaction(editingTransaction);
    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121218] p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="text-xs font-mono font-medium text-[#3DDC97] bg-[#3DDC97]/10 px-2.5 py-0.5 rounded-full border border-[#3DDC97]/30">
              {filteredTransactions.length} records
            </span>
          </h1>
          <p className="text-xs text-[#9A9AA5] mt-1">
            Search, edit categories, inspect sources, and export your college expenses.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportTransactionsToCSV(transactions)}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-[#17171D] border border-white/10 hover:border-white/20 disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#3DDC97]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onResetToSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#9A9AA5] hover:text-white bg-[#17171D] border border-white/10 hover:border-white/20 transition-colors"
            title="Reset to sample student data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7C5CFF]" />
            <span>Reset Samples</span>
          </button>

          {transactions.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[#FF6B6B] bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('add-expenses')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#17171D] p-3 sm:p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9A9AA5]" />
          <input
            type="text"
            placeholder="Search description or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#9A9AA5] focus:outline-none focus:border-[#7C5CFF]"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="relative">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
          >
            <option value="All">All Sources</option>
            {availableSources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
          >
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="amount-desc">Amount: Highest First</option>
            <option value="amount-asc">Amount: Lowest First</option>
          </select>
        </div>

      </div>

      {/* Transactions Container */}
      <div className="bg-[#17171D] rounded-2xl sm:rounded-[24px] border border-white/10 overflow-hidden shadow-sm">
        
        {/* Table summary sub-bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 flex items-center justify-between text-xs text-[#9A9AA5] bg-[#121218]">
          <span className="truncate">Showing <strong className="text-white">{filteredTransactions.length}</strong> of {transactions.length}</span>
          <span className="shrink-0 ml-2">Total: <strong className="text-white font-mono text-xs sm:text-sm">{currency}{totalFilteredAmount.toFixed(2)}</strong></span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-14 sm:py-20 text-center px-4 space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9A9AA5]">
              <ReceiptText className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No transactions found</h3>
              <p className="text-xs text-[#9A9AA5] mt-1 max-w-sm mx-auto">
                {searchTerm || selectedCategory !== 'All' || selectedSource !== 'All'
                  ? 'No results match your active search filters. Try clearing or expanding your criteria.'
                  : 'You have not added any transactions yet. Use file upload, paste, or manual entry.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {(searchTerm || selectedCategory !== 'All' || selectedSource !== 'All') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedSource('All'); }}
                  className="px-3 py-1.5 text-xs text-white bg-white/10 hover:bg-white/15 rounded-xl"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => onNavigateTab('add-expenses')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] rounded-xl shadow-sm"
              >
                Add Your First Expense
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE COMPACT CARDS VIEW (md:hidden) */}
            <div className="block md:hidden divide-y divide-white/5 p-2.5 sm:p-3 space-y-2.5">
              {filteredTransactions.map((tx) => {
                const catColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Others'];
                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#0B0B0F]/70 border border-white/5 hover:border-white/10 transition-colors space-y-2"
                  >
                    {/* Top Row: Date & Category */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#9A9AA5]" />
                        {tx.date}
                      </span>
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          backgroundColor: catColor.light,
                          color: catColor.primary,
                          border: `1px solid ${catColor.border}`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor.primary }} />
                        {tx.category}
                      </span>
                    </div>

                    {/* Middle: Description & Note */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{tx.description}</h4>
                      {tx.notes && (
                        <p className="text-[11px] text-[#9A9AA5] truncate mt-0.5 italic">{tx.notes}</p>
                      )}
                    </div>

                    {/* Bottom Row: Source, Amount & Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-[10px] text-[#9A9AA5] font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-[110px]">
                        {tx.source}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm">
                          {currency}{tx.amount.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTransaction({ ...tx })}
                            className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-[#7C5CFF] hover:bg-white/10 active:scale-95 transition-all"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-[#FF6B6B] hover:bg-white/10 active:scale-95 transition-all"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0B0F]/60 border-b border-white/10 text-[#9A9AA5] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Date</th>
                    <th className="py-3.5 px-4 font-semibold">Description</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Source</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((tx) => {
                    const catColor = CATEGORY_COLORS[tx.category] || CATEGORY_COLORS['Others'];
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors group">
                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {tx.date}
                        </td>

                        {/* Description & Note */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-white truncate">{tx.description}</div>
                          {tx.notes && (
                            <div className="text-[11px] text-[#9A9AA5] truncate mt-0.5 italic">
                              {tx.notes}
                            </div>
                          )}
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
                            style={{
                              backgroundColor: catColor.light,
                              color: catColor.primary,
                              border: `1px solid ${catColor.border}`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor.primary }} />
                            {tx.category}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 text-[#9A9AA5] whitespace-nowrap font-mono text-[11px]">
                          {tx.source}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                          {currency}{tx.amount.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingTransaction({ ...tx })}
                              className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-[#7C5CFF] hover:bg-white/5 transition-colors"
                              title="Edit transaction"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(tx.id)}
                              className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-[#FF6B6B] hover:bg-white/5 transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-[#17171D] border border-white/10 rounded-2xl sm:rounded-[24px] max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Edit Transaction</h3>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="text-[#9A9AA5] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Date</label>
                <input
                  type="date"
                  required
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF]"
                />
              </div>

              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Description</label>
                <input
                  type="text"
                  required
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9A9AA5] mb-1 font-medium">Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#9A9AA5] mb-1 font-medium">Category</label>
                  <select
                    value={editingTransaction.category}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value as ExpenseCategory })}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF]"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Source</label>
                <input
                  type="text"
                  value={editingTransaction.source}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, source: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF]"
                />
              </div>

              <div>
                <label className="block text-[#9A9AA5] mb-1 font-medium">Notes</label>
                <input
                  type="text"
                  value={editingTransaction.notes || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#7C5CFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-3.5 py-2 text-[#9A9AA5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17171D] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF6B6B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Transaction?</h3>
            </div>
            <p className="text-xs text-[#9A9AA5]">
              Are you sure you want to delete this transaction? This will immediately recalculate your dashboard stats and budget metrics.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 text-xs text-[#9A9AA5] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(deletingId);
                  setDeletingId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF6B6B] hover:bg-[#e05656] rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CLEAR ALL CONFIRMATION MODAL ================= */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17171D] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF6B6B]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Clear All Transactions?</h3>
            </div>
            <p className="text-xs text-[#9A9AA5]">
              This will remove all {transactions.length} transactions from local storage. You can restore sample transactions anytime using the "Reset Samples" button.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#9A9AA5] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF6B6B] hover:bg-[#e05656] rounded-xl"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
