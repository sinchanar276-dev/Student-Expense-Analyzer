import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  HelpCircle,
  TrendingDown,
  DollarSign,
  UtensilsCrossed,
  Wallet,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Transaction, BudgetConfig } from '../types';

import { useAuth } from '../context/AuthContext';
import { generateClientChatReply } from '../utils/clientChatEngine';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface FinancialChatbotProps {
  transactions: Transaction[];
  budget: BudgetConfig;
  currency: string;
  isFloating?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  initialPrompt?: string;
  onOpenMailModal?: () => void;
}

export const FinancialChatbot: React.FC<FinancialChatbotProps> = ({
  transactions,
  budget,
  currency,
  isFloating = false,
  isOpen = true,
  onClose,
  initialPrompt,
  onOpenMailModal,
}) => {
  const { user } = useAuth();
  const studentEmail = user?.email || 'sinchanar276@gmail.com';
  const studentName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Sinchanar');

  const [messages, setMessages] = useState<Message[]>(() => {
    return [
      {
        id: '1',
        sender: 'bot',
        text: `👋 Hey **${studentName}**! I'm **Budgio AI**, your personal student finance assistant.\n\nI have complete access to your profile (**${studentEmail}**), live expense logs, and budget limits. Ask me anything:\n* *"What is my current profile and financial status?"*\n* *"Did I exceed my budget limit?"*\n* *"How is my savings goal for laptop progressing?"*\n* *"How much did I spend on Food or Transport?"*\n* *"Can I afford a $35 dinner tonight?"*\n* *"Send my monthly expense report in PDF format"*\n\nHow can I help you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle external initialPrompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // Read savings goal from localStorage
  const getSavingsGoal = () => {
    const saved = localStorage.getItem('sea_savings_goal');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      name: 'MacBook Pro for College',
      savedAmount: 680,
      targetAmount: 1200,
    };
  };

  // Compute live context payload with FULL profile and financial details
  const buildFinancialContext = () => {
    const totalSpent = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const monthlyBudget = budget.monthlyBudget || 1000;
    const remainingBudget = monthlyBudget - totalSpent;
    const isOverBudget = totalSpent > monthlyBudget;
    const overrunAmount = isOverBudget ? totalSpent - monthlyBudget : 0;
    const budgetUtilization = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;

    const uniqueDates = new Set(transactions.map((t) => t.date));
    const daysLogged = Math.max(1, uniqueDates.size);
    const dailyAverage = totalSpent / daysLogged;

    // Category breakdown
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    transactions.forEach((t) => {
      const cat = t.category || 'Others';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 };
      }
      categoryTotals[cat].amount += t.amount;
      categoryTotals[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, data]) => ({
      category: cat,
      amount: data.amount,
      percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
      count: data.count,
    }));

    const topExpenses = [...transactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        source: t.source,
      }));

    const recentTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15)
      .map((t) => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        source: t.source,
      }));

    const savingsGoal = getSavingsGoal();

    return {
      totalSpent,
      monthlyBudget,
      remainingBudget,
      budgetUtilization,
      dailyAverage,
      transactionCount: transactions.length,
      categoryBreakdown,
      topExpenses,
      recentTransactions,
      allTransactions: transactions.slice(0, 30),
      currency,
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      userProfile: {
        displayName: studentName,
        email: studentEmail,
        university: 'Student University',
        major: 'Computer Science / Engineering',
        monthlyAllowance: monthlyBudget,
      },
      savingsGoal,
      categoryBudgets: budget.categoryBudgets,
      isOverBudget,
      overrunAmount,
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = buildFinancialContext();
      let botReply = '';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            context,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) {
            botReply = data.reply;
          }
        }
      } catch (fetchErr) {
        console.warn('Backend /api/chat unreachable (e.g. Netlify static hosting). Running client-side analysis engine:', fetchErr);
      }

      // If backend was unreachable (e.g. deployed on Netlify/static host) or returned empty, use client engine
      if (!botReply) {
        botReply = generateClientChatReply(query, context);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat bot error:', err);
      const context = buildFinancialContext();
      const fallbackReply = generateClientChatReply(query, context);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: `Conversation cleared. What financial questions can I answer about your ${currency}${transactions.reduce((acc, t) => acc + (t.amount || 0), 0).toFixed(0)} spending?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    { label: '👤 My Profile & Account', query: 'Show me my complete profile and account details' },
    { label: '⚠️ Did I exceed budget?', query: 'Did I exceed my budget limit, and what is my overrun status?' },
    { label: '🎯 Savings Goal Progress', query: 'How much have I saved towards my laptop goal and what is the target?' },
    { label: '🍔 Food Spending', query: 'How much did I spend on Food this month?' },
    { label: '🍕 Afford $35 Dinner?', query: 'Can I afford a $35 dinner tonight with my current budget?' },
    { label: '🏆 Biggest Expense', query: 'What is my highest expense this month?' },
    { label: '📧 Send PDF Statement', query: 'Can you send my monthly expense statement in PDF format to my email?' },
  ];

  // Helper to render markdown-like formatting (bolding, lists)
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Bold tags **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={lIdx} className="ml-4 list-disc text-xs sm:text-sm text-[#E2E8F0]">
            {renderedParts}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={lIdx} className="h-2" />;
      }

      return (
        <p key={lIdx} className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  if (isFloating && !isOpen) return null;

  const containerClasses = isFloating
    ? 'fixed top-24 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[420px] h-[540px] max-h-[calc(100vh-7rem)] flex flex-col bg-[#121218] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn'
    : 'w-full max-w-4xl mx-auto flex flex-col h-[750px] max-h-[82vh] bg-[#121218] border border-white/10 rounded-2xl shadow-xl overflow-hidden';

  return (
    <div className={containerClasses}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-[#17171D]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] flex items-center justify-center text-white shadow-md shadow-[#7C5CFF]/30">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#3DDC97] border-2 border-[#17171D]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">Budgio Financial Assistant</h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-[#9A9AA5]">
              Live sync with {transactions.length} records &bull; {currency}{budget.monthlyBudget} budget
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9A9AA5] hover:text-white hover:bg-white/5 transition-colors"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 space-y-1 ${
                  isBot
                    ? 'bg-[#1A1A23] border border-white/10 text-white rounded-tl-sm'
                    : 'bg-gradient-to-r from-[#7C5CFF] to-[#6c48f8] text-white rounded-tr-sm shadow-md shadow-[#7C5CFF]/20'
                }`}
              >
                <div>{formatText(msg.text)}</div>
                <div
                  className={`text-[9px] text-right mt-1 ${
                    isBot ? 'text-[#9A9AA5]' : 'text-white/70'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {!isBot && (
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] flex items-center justify-center text-white shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#1A1A23] border border-white/10 rounded-2xl rounded-tl-sm p-3.5 flex items-center gap-1.5 text-xs text-[#9A9AA5]">
              <div className="w-2 h-2 rounded-full bg-[#7C5CFF] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse delay-150" />
              <div className="w-2 h-2 rounded-full bg-white animate-pulse delay-300" />
              <span className="ml-1 text-[11px]">Analyzing your expenses...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 pt-2 pb-1.5 border-t border-white/5 bg-[#17171D] overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#9A9AA5] hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 sm:p-4 bg-[#17171D] border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Budgio AI (e.g. How much did I spend on Food?)..."
          disabled={loading}
          className="flex-1 bg-[#121218] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#9A9AA5] focus:outline-none focus:border-[#7C5CFF] transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] text-white hover:opacity-95 shadow-md shadow-[#7C5CFF]/30 transition-all disabled:opacity-40 cursor-pointer shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
