/**
 * Client-Side Intelligent Financial Analysis Engine
 * Ensures Budgio AI chatbot and financial insights work seamlessly across all deployment
 * environments, including static hosts (Netlify, GitHub Pages, Vercel) where a Node.js backend
 * is not running.
 */

export interface ChatContext {
  totalSpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  dailyAverage: number;
  transactionCount: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number; count?: number }>;
  topExpenses: Array<{ date: string; description: string; amount: number; category: string; source?: string }>;
  recentTransactions?: Array<any>;
  currency?: string;
  userProfile?: {
    displayName?: string;
    email?: string;
    university?: string;
    major?: string;
  };
  savingsGoal?: {
    name: string;
    savedAmount: number;
    targetAmount: number;
  } | null;
  categoryBudgets?: Partial<Record<string, number>>;
  isOverBudget?: boolean;
  overrunAmount?: number;
}

export function generateClientChatReply(message: string, context: ChatContext): string {
  const {
    totalSpent = 0,
    monthlyBudget = 0,
    remainingBudget = 0,
    budgetUtilization = 0,
    dailyAverage = 0,
    transactionCount = 0,
    categoryBreakdown = [],
    topExpenses = [],
    currency = '$',
    userProfile = {},
    savingsGoal = null,
    isOverBudget = false,
    overrunAmount = 0,
  } = context;

  const studentName = userProfile.displayName || 'Student';
  const studentEmail = userProfile.email || 'sinchanar276@gmail.com';
  const university = userProfile.university || 'University Student';
  const major = userProfile.major || 'Computer Science / Engineering';

  const lower = message.toLowerCase().trim();

  // 1. Profile, Identity & Account
  if (
    lower.includes('who am i') ||
    lower.includes('my profile') ||
    lower.includes('email') ||
    lower.includes('account') ||
    lower.includes('name') ||
    lower.includes('details')
  ) {
    return `👤 **Your Student Profile:**\n- **Name:** ${studentName}\n- **Email:** ${studentEmail}\n- **Institution:** ${university}\n- **Major:** ${major}\n- **Tracked Currency:** ${currency}\n- **Total Transactions:** ${transactionCount} logged\n- **Budget Ceiling:** ${currency}${monthlyBudget.toFixed(2)}`;
  }

  // 2. Savings Goal Progress
  if (
    lower.includes('savings') ||
    lower.includes('goal') ||
    lower.includes('laptop') ||
    lower.includes('macbook') ||
    lower.includes('save')
  ) {
    if (savingsGoal) {
      const pct =
        savingsGoal.targetAmount > 0
          ? ((savingsGoal.savedAmount / savingsGoal.targetAmount) * 100).toFixed(1)
          : '0';
      const toSave = Math.max(0, savingsGoal.targetAmount - savingsGoal.savedAmount);
      return `🎯 **Savings Goal: ${savingsGoal.name}**\n- **Saved So Far:** ${currency}${savingsGoal.savedAmount.toFixed(2)}\n- **Target Amount:** ${currency}${savingsGoal.targetAmount.toFixed(2)}\n- **Remaining to Save:** ${currency}${toSave.toFixed(2)}\n- **Completion:** ${pct}% completed!\n\n💡 *Tip:* Setting aside just ${currency}${(toSave / 4).toFixed(0)} per week will reach your target within a month!`;
    }
    return `🎯 You haven't configured an active savings goal yet. You can set one up anytime in the **Dashboard** under Savings Goals!`;
  }

  // 3. Budget Status & Overrun Warnings
  if (
    lower.includes('exceed') ||
    lower.includes('over budget') ||
    lower.includes('limit') ||
    lower.includes('warning') ||
    lower.includes('alert') ||
    lower.includes('deficit')
  ) {
    if (isOverBudget) {
      return `⚠️ **Budget Overrun Alert!**\nYou have **exceeded your monthly budget** of **${currency}${monthlyBudget.toFixed(2)}** by **${currency}${overrunAmount.toFixed(2)}** (Total spent: **${currency}${totalSpent.toFixed(2)}**, ${budgetUtilization.toFixed(1)}% utilized).\n\n💡 *Action Plan:* Freeze non-essential shopping and takeout meals for the rest of this cycle to stabilize your campus budget!`;
    }
    return `✅ **Budget On Track:** You have not exceeded your budget! You have spent **${currency}${totalSpent.toFixed(2)}** of your **${currency}${monthlyBudget.toFixed(2)}** ceiling (**${currency}${remainingBudget.toFixed(2)}** remaining, ${budgetUtilization.toFixed(1)}% used).`;
  }

  // 4. Food & Dining
  if (
    lower.includes('food') ||
    lower.includes('eat') ||
    lower.includes('grocery') ||
    lower.includes('groceries') ||
    lower.includes('dining') ||
    lower.includes('restaurant') ||
    lower.includes('takeout')
  ) {
    const foodCat = categoryBreakdown.find((c) => c.category === 'Food');
    const amt = foodCat ? foodCat.amount : 0;
    const pct = foodCat ? foodCat.percentage : 0;
    return `🍔 **Food & Dining Analysis:**\nYou have spent **${currency}${amt.toFixed(2)}** on Food, representing **${pct.toFixed(1)}%** of your total monthly expenditures across ${foodCat?.count || 0} transactions.\n\n💡 *Student Tip:* Cooking 3 bulk meals on weekends can reduce food outlays by up to 35% compared to campus cafe takeout.`;
  }

  // 5. Transport
  if (
    lower.includes('transport') ||
    lower.includes('bus') ||
    lower.includes('uber') ||
    lower.includes('metro') ||
    lower.includes('subway') ||
    lower.includes('transit')
  ) {
    const transCat = categoryBreakdown.find((c) => c.category === 'Transport');
    const amt = transCat ? transCat.amount : 0;
    const pct = transCat ? transCat.percentage : 0;
    return `🚌 **Transportation Spending:**\nYou have spent **${currency}${amt.toFixed(2)}** on Transport (${pct.toFixed(1)}% of your expenses).\n\n💡 *Tip:* Check your student union for semester bus/metro passes—they typically cost 30-50% less than daily rides.`;
  }

  // 6. Affordability Check ("Can I afford...")
  if (
    lower.includes('afford') ||
    lower.includes('can i buy') ||
    lower.includes('should i buy') ||
    lower.includes('can i spend')
  ) {
    const match = message.match(/\$?(\d+(\.\d+)?)/);
    const itemCost = match ? parseFloat(match[1]) : 40;
    if (itemCost > remainingBudget) {
      return `⚠️ **Affordability Check:**\nSpending **${currency}${itemCost.toFixed(2)}** would exceed your remaining buffer of **${currency}${remainingBudget.toFixed(2)}**.\n\nI recommend postponing this purchase until the next allowance cycle or finding a discount!`;
    }
    const leftover = remainingBudget - itemCost;
    return `✅ **Affordability Check:**\nYes, you have **${currency}${remainingBudget.toFixed(2)}** remaining in your budget. Spending **${currency}${itemCost.toFixed(2)}** will leave you with **${currency}${leftover.toFixed(2)}** buffer.\n\nIt is affordable within your limit!`;
  }

  // 7. General Budget / Remaining Allowance
  if (
    lower.includes('budget') ||
    lower.includes('left') ||
    lower.includes('remaining') ||
    lower.includes('how much') ||
    lower.includes('balance')
  ) {
    return `📊 **Current Budget Snapshot:**\n- **Monthly Limit:** ${currency}${monthlyBudget.toFixed(2)}\n- **Total Spent:** ${currency}${totalSpent.toFixed(2)} (${budgetUtilization.toFixed(1)}% used)\n- **Remaining Cushion:** ${currency}${remainingBudget.toFixed(2)}\n- **Daily Spending Pace:** ${currency}${dailyAverage.toFixed(2)}/day\n\n${
      isOverBudget
        ? `⚠️ **Warning:** You have overrun your monthly ceiling by ${currency}${overrunAmount.toFixed(2)}.`
        : budgetUtilization > 85
        ? '⚠️ **Caution:** You have utilized over 85% of your allowance. Prioritize essentials only.'
        : '✅ You are pacing comfortably within your student budget limits!'
    }`;
  }

  // 8. Top / Largest Purchases
  if (
    lower.includes('highest') ||
    lower.includes('biggest') ||
    lower.includes('most expensive') ||
    lower.includes('largest')
  ) {
    const top = topExpenses[0];
    return top
      ? `🏆 **Your Largest Purchase:**\nYour highest recorded expense was **"${top.description}"** for **${currency}${Number(top.amount).toFixed(2)}** (${top.category}) on ${top.date}.`
      : `No expense records logged yet to determine a top purchase.`;
  }

  // 9. Email Statements & PDF Reports
  if (
    lower.includes('email') ||
    lower.includes('report') ||
    lower.includes('statement') ||
    lower.includes('pdf') ||
    lower.includes('mail')
  ) {
    return `📧 **Email Statements & PDF Reports:**\nBudgio is configured to deliver statements and budget warning alerts to **${studentEmail}** with complete audit PDFs.\n\nYou can also click the **"Email Report"** button in the top navigation bar at any time to generate or download the official PDF directly!`;
  }

  // 10. Default Helpful Overview
  return `👋 **Hey ${studentName}!** Here is your live Budgio financial pulse:\n- **Registered Email:** ${studentEmail}\n- **Current Spend:** ${currency}${totalSpent.toFixed(2)} of ${currency}${monthlyBudget.toFixed(2)} (${budgetUtilization.toFixed(1)}%)\n- **Daily Pace:** ${currency}${dailyAverage.toFixed(2)}/day\n- **Remaining Buffer:** ${currency}${remainingBudget.toFixed(2)}${isOverBudget ? ` ⚠️ (Over by ${currency}${overrunAmount.toFixed(2)})` : ''}\n\nAsk me anything:\n* *"What is my profile & account status?"*\n* *"Did I exceed my budget limit?"*\n* *"How is my savings goal progressing?"*\n* *"How much did I spend on Food or Transport?"*\n* *"Can I afford a $35 dinner tonight?"*`;
}
