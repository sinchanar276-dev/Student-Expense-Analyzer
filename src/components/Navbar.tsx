import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  PlusCircle, 
  Download,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types';
import { downloadSampleCSV } from '../utils/sampleData';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currency: string;
  setCurrency: (c: string) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  isDark,
  setIsDark,
  onQuickAdd,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOutUser, openAuthModal } = useAuth();

  const navLinks: { id: ActiveTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'add-expenses', label: 'Add Expenses' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'budget-planner', label: 'Budget Planner' },
    { id: 'spending-insights', label: 'Spending Insights' },
    { id: 'how-to-save', label: 'How to Save' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0B0F]/90 dark:bg-[#0B0B0F]/90 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          
          {/* Zone 1: Brand Wordmark (Single text element wordmark with icon) */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 select-none group"
          >
            <img 
              src="/assets/aistudio/image_05f63413.png" 
              alt="Budgio App Icon" 
              className="w-9 h-9 rounded-xl object-cover shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/15" 
            />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-[#3DDC97] transition-colors">
                Budgio
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (single line, subtle hover underlines) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs xl:text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'text-white font-semibold' 
                      : 'text-[#9A9AA5] hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#7C5CFF] to-[#3DDC97] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="flex items-center bg-[#17171D] border border-white/10 rounded-lg p-0.5 text-xs">
              {['$', '₹', '€', '£'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`w-6 sm:w-7 h-6 rounded flex items-center justify-center font-mono text-[11px] sm:text-xs transition-all ${
                    currency === curr
                      ? 'bg-[#7C5CFF] text-white font-bold shadow-sm'
                      : 'text-[#9A9AA5] hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle theme"
              className="p-1.5 sm:p-2 rounded-lg bg-[#17171D] border border-white/10 text-[#9A9AA5] hover:text-white hover:border-[#7C5CFF]/40 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#FBBF24]" /> : <Moon className="w-4 h-4 text-[#7C5CFF]" />}
            </button>

            {/* User Account / Sign In Control */}
            {user ? (
              <div className="relative flex items-center gap-2 pl-1">
                <div 
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs"
                  title={`Logged in as ${user.email}`}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#3DDC97] text-white flex items-center justify-center font-bold text-[10px]">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium text-white max-w-[90px] truncate text-xs">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={signOutUser}
                    className="text-[10px] text-[#FF6B6B] hover:underline font-semibold ml-1"
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C5CFF] to-[#6a47fc] hover:opacity-95 shadow-[0_0_15px_rgba(124,92,255,0.35)] transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Quick Add Expense Button (Desktop / Tablet only, mobile uses bottom nav) */}
            <button
              onClick={onQuickAdd}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#3DDC97] hover:bg-[#34c787] text-slate-900 font-bold transition-all shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {/* Mobile Menu Button for Utilities */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-[#17171D] border border-white/10 text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#121218] px-4 pt-3 pb-5 space-y-3">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium ${
                  activeTab === link.id
                    ? 'bg-[#7C5CFF]/20 text-white border border-[#7C5CFF]/40'
                    : 'text-[#9A9AA5] hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#9A9AA5]">Currency</span>
            <div className="flex items-center gap-1">
              {['$', '₹', '€', '£'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold ${
                    currency === curr
                      ? 'bg-[#7C5CFF] text-white'
                      : 'bg-white/5 text-[#9A9AA5]'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                downloadSampleCSV();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#3DDC97] bg-[#3DDC97]/10 border border-[#3DDC97]/30 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample Student CSV</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
