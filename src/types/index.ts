export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Education'
  | 'Accommodation'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Others';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Education',
  'Accommodation',
  'Shopping',
  'Entertainment',
  'Health',
  'Others',
];

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: ExpenseCategory;
  source: string; // e.g. "Manual", "CSV Upload", "Excel (.xlsx)", "PDF Statement", "Quick Paste", "Receipt Scan"
  notes?: string;
}

export interface BudgetConfig {
  monthlyBudget: number;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
  currency: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export const CATEGORY_COLORS: Record<ExpenseCategory, { primary: string; light: string; border: string }> = {
  Food: { primary: '#FF6B6B', light: 'rgba(255, 107, 107, 0.15)', border: 'rgba(255, 107, 107, 0.3)' },
  Transport: { primary: '#3DDC97', light: 'rgba(61, 220, 151, 0.15)', border: 'rgba(61, 220, 151, 0.3)' },
  Education: { primary: '#7C5CFF', light: 'rgba(124, 92, 255, 0.15)', border: 'rgba(124, 92, 255, 0.3)' },
  Accommodation: { primary: '#38BDF8', light: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' },
  Shopping: { primary: '#FBBF24', light: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.3)' },
  Entertainment: { primary: '#F472B6', light: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.3)' },
  Health: { primary: '#06B6D4', light: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)' },
  Others: { primary: '#9A9AA5', light: 'rgba(154, 154, 165, 0.15)', border: 'rgba(154, 154, 165, 0.3)' },
};

export type ActiveTab =
  | 'dashboard'
  | 'add-expenses'
  | 'transactions'
  | 'budget-planner'
  | 'spending-insights'
  | 'expense-predictor'
  | 'ai-chat'
  | 'how-to-save'
  | 'features';
