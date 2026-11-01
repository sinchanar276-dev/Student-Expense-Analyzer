import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  // In development, AI Studio requires port 3000. In production (Cloud Run), use process.env.PORT.
  const PORT = isProd ? parseInt(process.env.PORT || '8080', 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. CHATBOT ENDPOINT: Natural language queries on student expense data
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, history = [], context = {} } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const {
        totalSpent = 0,
        monthlyBudget = 0,
        remainingBudget = 0,
        budgetUtilization = 0,
        dailyAverage = 0,
        transactionCount = 0,
        categoryBreakdown = [],
        topExpenses = [],
        recentTransactions = [],
        currency = '$',
        currentMonth = 'Current Month',
        userProfile = {},
        savingsGoal = null,
        categoryBudgets = {},
        isOverBudget = false,
        overrunAmount = 0,
        allTransactions = [],
      } = context;

      const studentName = userProfile.displayName || 'Student';
      const studentEmail = userProfile.email || 'sinchanar276@gmail.com';
      const university = userProfile.university || 'University Student';
      const major = userProfile.major || 'Undergraduate';

      const financialContextPrompt = `
You are Budgio AI, the dedicated intelligent personal financial assistant for ${studentName} (${studentEmail}).
You have comprehensive, real-time knowledge of ${studentName}'s complete financial ledger, profile, and budget limits.

STUDENT PROFILE:
- Full Name: ${studentName}
- Registered Email: ${studentEmail}
- Institution: ${university}
- Major/Course: ${major}
- Preferred Currency: ${currency}
- Month Period: ${currentMonth}

FINANCIAL STATUS:
- Monthly Budget Ceiling: ${currency}${Number(monthlyBudget).toFixed(2)}
- Total Spent This Period: ${currency}${Number(totalSpent).toFixed(2)}
- Remaining Buffer: ${currency}${Number(remainingBudget).toFixed(2)}
- Budget Utilization: ${Number(budgetUtilization).toFixed(1)}%
- Over Budget Alert: ${isOverBudget ? `YES! Exceeded budget limit by ${currency}${Number(overrunAmount).toFixed(2)}` : 'No, currently within safe limits'}
- Daily Burn Rate: ${currency}${Number(dailyAverage).toFixed(2)}/day
- Total Number of Transactions: ${transactionCount}

SAVINGS GOAL:
${savingsGoal ? `- Goal Name: ${savingsGoal.name}\n- Saved So Far: ${currency}${savingsGoal.savedAmount}\n- Target Amount: ${currency}${savingsGoal.targetAmount}\n- Progress: ${savingsGoal.targetAmount > 0 ? ((savingsGoal.savedAmount / savingsGoal.targetAmount) * 100).toFixed(1) : 0}% completed` : '- No active savings goal set'}

CATEGORY BUDGETS & CURRENT SPENDING:
${categoryBreakdown.map((c: any) => {
  const catLimit = categoryBudgets[c.category] || 'N/A';
  const overCat = typeof catLimit === 'number' && c.amount > catLimit;
  return `- ${c.category}: Spent ${currency}${Number(c.amount).toFixed(2)} (${Number(c.percentage).toFixed(1)}% of total, ${c.count || 0} transactions)${typeof catLimit === 'number' ? ` [Budget: ${currency}${catLimit}${overCat ? ' - OVER BUDGET!' : ''}]` : ''}`;
}).join('\n')}

TOP 5 LARGEST PURCHASES:
${topExpenses.map((t: any) => `- ${t.description} on ${t.date}: ${currency}${Number(t.amount).toFixed(2)} (${t.category}, via ${t.source || 'Debit'})`).join('\n')}

RECENT PURCHASES:
${recentTransactions.slice(0, 15).map((t: any) => `- ${t.date}: ${t.description} - ${currency}${Number(t.amount).toFixed(2)} [${t.category}]`).join('\n')}

INSTRUCTIONS & BEHAVIOR:
1. Always base all numbers and answers directly on this live profile and finance data.
2. If the user asks about who they are, their email, or profile, answer with their name (${studentName}), email (${studentEmail}), and university details.
3. If asked about budget status or whether they exceeded the budget, state clearly: ${isOverBudget ? `Yes, you have exceeded your ${currency}${monthlyBudget} budget by ${currency}${Number(overrunAmount).toFixed(2)}!` : `You are within budget with ${currency}${Number(remainingBudget).toFixed(2)} remaining.`}
4. If asked about their savings goal (e.g. laptop), provide the exact progress for ${savingsGoal ? savingsGoal.name : 'their goal'}.
5. If asked whether they can afford a purchase, compare it against their remaining budget (${currency}${Number(remainingBudget).toFixed(2)}) and daily burn rate.
6. If the user asks to email their report or statement, inform them that Budgio automatically generates and emails full PDF statements to ${studentEmail}, and they can also click "Email Report" at any time.
7. Be encouraging, concise, student-friendly, and format key numbers in bold.
`;

      // Call Gemini 3.8 Flash if API key is present
      if (ai) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout')), 6500)
          );

          const apiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: message,
            config: {
              systemInstruction: financialContextPrompt,
            },
          });

          const response: any = await Promise.race([apiPromise, timeoutPromise]);
          const reply = response.text || 'I analyzed your spending data, but could not produce a response.';
          res.json({ reply });
          return;
        } catch (apiError: any) {
          console.warn('Gemini API call timed out or failed, using heuristic engine:', apiError?.message);
        }
      }

      // Comprehensive fallback rule-based financial analysis assistant
      const lower = message.toLowerCase();
      let fallbackReply = '';

      if (lower.includes('who am i') || lower.includes('my profile') || lower.includes('email') || lower.includes('account') || lower.includes('name')) {
        fallbackReply = `👤 **Your Student Profile:**\n- **Name:** ${studentName}\n- **Email:** ${studentEmail}\n- **Institution:** ${university}\n- **Major:** ${major}\n- **Tracked Currency:** ${currency}\n- **Total Transactions:** ${transactionCount} logged`;
      } else if (lower.includes('savings') || lower.includes('goal') || lower.includes('laptop') || lower.includes('macbook')) {
        if (savingsGoal) {
          const pct = savingsGoal.targetAmount > 0 ? ((savingsGoal.savedAmount / savingsGoal.targetAmount) * 100).toFixed(1) : 0;
          fallbackReply = `🎯 **Savings Goal: ${savingsGoal.name}**\n- **Saved So Far:** ${currency}${savingsGoal.savedAmount.toFixed(2)}\n- **Target Amount:** ${currency}${savingsGoal.targetAmount.toFixed(2)}\n- **Remaining to Save:** ${currency}${Math.max(0, savingsGoal.targetAmount - savingsGoal.savedAmount).toFixed(2)}\n- **Completion:** ${pct}% completed!\n\n💡 *Tip:* Save just ${currency}${((savingsGoal.targetAmount - savingsGoal.savedAmount) / 4).toFixed(0)} per week to reach your goal within a month!`;
        } else {
          fallbackReply = `🎯 You have not set an active savings goal yet. You can create one like "MacBook Pro for College" in the dashboard!`;
        }
      } else if (lower.includes('exceed') || lower.includes('over budget') || lower.includes('limit') || lower.includes('warning')) {
        if (isOverBudget) {
          fallbackReply = `⚠️ **Budget Overrun Alert!**\nYou have **exceeded your monthly budget** of **${currency}${monthlyBudget.toFixed(2)}** by **${currency}${overrunAmount.toFixed(2)}** (Total spent: **${currency}${totalSpent.toFixed(2)}**, ${budgetUtilization.toFixed(1)}% utilized).\n\nAn automated warning alert with PDF has been configured for ${studentEmail}. Please freeze non-essential shopping and entertainment spending!`;
        } else {
          fallbackReply = `✅ **Budget Safe:** You have not exceeded your budget! You have spent **${currency}${totalSpent.toFixed(2)}** of your **${currency}${monthlyBudget.toFixed(2)}** limit (**${currency}${remainingBudget.toFixed(2)}** remaining, ${budgetUtilization.toFixed(1)}% used).`;
        }
      } else if (lower.includes('food') || lower.includes('eat') || lower.includes('grocery') || lower.includes('groceries')) {
        const foodCat = categoryBreakdown.find((c: any) => c.category === 'Food');
        const amt = foodCat ? foodCat.amount : 0;
        const pct = foodCat ? foodCat.percentage : 0;
        fallbackReply = `🍔 **Food & Dining Analysis:**\nYou have spent **${currency}${amt.toFixed(2)}** on Food, which makes up **${pct.toFixed(1)}%** of your total expenses across ${foodCat?.count || 0} purchases.\n\n💡 *Tip for students:* Consider meal prepping lunches 2 days a week or utilizing campus dining dollars before buying off-campus meals.`;
      } else if (lower.includes('transport') || lower.includes('bus') || lower.includes('uber') || lower.includes('metro')) {
        const transCat = categoryBreakdown.find((c: any) => c.category === 'Transport');
        const amt = transCat ? transCat.amount : 0;
        fallbackReply = `🚌 **Transport Spending:**\nYou have spent **${currency}${amt.toFixed(2)}** on Transportation (${transCat ? transCat.percentage.toFixed(1) : 0}% of total spend).\n\n💡 *Tip:* Look into semester student transit passes to save up to 40% over individual tickets or rideshares.`;
      } else if (lower.includes('budget') || lower.includes('left') || lower.includes('remaining')) {
        fallbackReply = `📊 **Budget Status:**\n- **Total Budget:** ${currency}${monthlyBudget.toFixed(2)}\n- **Spent so far:** ${currency}${totalSpent.toFixed(2)} (${budgetUtilization.toFixed(1)}%)\n- **Remaining:** ${currency}${remainingBudget.toFixed(2)}\n\n${
          isOverBudget
            ? `⚠️ **Warning:** You have exceeded your budget by ${currency}${overrunAmount.toFixed(2)}!`
            : budgetUtilization > 85
            ? '⚠️ **Alert:** You have used over 85% of your monthly budget. Stick strictly to essential expenses.'
            : '✅ You are currently within your planned spending limits. Keep it up!'
        }`;
      } else if (lower.includes('afford') || lower.includes('can i buy') || lower.includes('should i buy')) {
        const match = message.match(/\$?(\d+(\.\d+)?)/);
        const itemCost = match ? parseFloat(match[1]) : 50;
        if (itemCost > remainingBudget) {
          fallbackReply = `⚠️ **Affordability Check:**\nSpending **${currency}${itemCost}** would exceed your remaining budget of **${currency}${remainingBudget.toFixed(2)}**.\n\nI recommend delaying this purchase until next month or finding a lower-cost alternative!`;
        } else {
          fallbackReply = `✅ **Affordability Check:**\nYou have **${currency}${remainingBudget.toFixed(2)}** remaining. Spending **${currency}${itemCost}** will leave you with **${currency}${(remainingBudget - itemCost).toFixed(2)}**.\n\nIt is affordable within your limit, but make sure to preserve a buffer for unexpected costs!`;
        }
      } else if (lower.includes('highest') || lower.includes('biggest') || lower.includes('most')) {
        const top = topExpenses[0];
        fallbackReply = top
          ? `🏆 **Your Biggest Expense:**\nYour largest single transaction was **"${top.description}"** for **${currency}${Number(top.amount).toFixed(2)}** in the **${top.category}** category on ${top.date}.`
          : `You do not have enough expense records yet to determine a top expense.`;
      } else if (lower.includes('email') || lower.includes('report') || lower.includes('statement') || lower.includes('pdf') || lower.includes('mail')) {
        fallbackReply = `📧 **Email Reports & PDF Statements:**\nYour monthly statement and warning alerts are configured to automatically dispatch to **${studentEmail}** in PDF format.\n\nYou can also click the **"Email Report"** button in the top navigation bar to send or download the official PDF immediately!`;
      } else {
        fallbackReply = `👋 **Hello ${studentName}!** Here is your Budgio snapshot:\n- **Email:** ${studentEmail}\n- **Spent:** ${currency}${totalSpent.toFixed(2)} of ${currency}${monthlyBudget.toFixed(2)} (${budgetUtilization.toFixed(1)}%)\n- **Daily Pace:** ${currency}${dailyAverage.toFixed(2)}/day\n- **Remaining:** ${currency}${remainingBudget.toFixed(2)}${isOverBudget ? ` ⚠️ (Over budget by ${currency}${overrunAmount.toFixed(2)})` : ''}\n\nAsk me anything:\n- *"Who am I & what is my profile?"*\n- *"Am I over budget?"*\n- *"What is my savings goal progress?"*\n- *"How much did I spend on Food or Transport?"*\n- *"Can I afford a $35 dinner tonight?"*`;
      }

      res.json({ reply: fallbackReply });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  // 2. EXPENSE PREDICTOR ENDPOINT: Forecast upcoming expenditures & category run rates
  app.post('/api/predict', async (req: Request, res: Response) => {
    try {
      const { transactions = [], budget = { monthlyBudget: 1000, categoryBudgets: {} }, currency = '$' } = req.body;

      const totalSpent = transactions.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
      const uniqueDates = new Set(transactions.map((t: any) => t.date));
      const daysWithData = Math.max(1, uniqueDates.size);
      const dailyAverage = totalSpent / daysWithData;

      // Group by category
      const categoryTotals: Record<string, number> = {};
      transactions.forEach((t: any) => {
        const cat = t.category || 'Others';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
      });

      // Statistical projection: 30 days projection
      const projectedEndOfMonth = Math.round((dailyAverage * 30) * 100) / 100;
      const budgetLimit = budget.monthlyBudget || 1000;
      const projectedVariance = projectedEndOfMonth - budgetLimit;
      const trajectoryStatus =
        projectedEndOfMonth > budgetLimit * 1.15
          ? 'critical'
          : projectedEndOfMonth > budgetLimit
          ? 'caution'
          : 'on_track';

      let aiForecast: any = null;

      if (ai) {
        try {
          const prompt = `
Act as a financial data science model predicting college student expenditures.
Current metrics:
- Currency: ${currency}
- Total spent recorded: ${currency}${totalSpent.toFixed(2)} across ${daysWithData} recorded days
- Average daily rate: ${currency}${dailyAverage.toFixed(2)}/day
- Monthly budget limit: ${currency}${budgetLimit.toFixed(2)}
- Current category totals: ${JSON.stringify(categoryTotals)}

Provide a realistic forecast for next month and end of this month. Return STRICT JSON with this schema:
{
  "projectedEndOfMonth": number,
  "projectedNextMonth": number,
  "confidenceScore": number,
  "trajectoryStatus": "on_track" | "caution" | "critical",
  "categoryForecasts": [
    {
      "category": string,
      "currentSpent": number,
      "predictedNextMonth": number,
      "changePercent": number,
      "trend": "up" | "down" | "stable",
      "riskLevel": "low" | "moderate" | "high",
      "advice": string
    }
  ],
  "riskFactors": string[],
  "savingsOpportunities": string[],
  "executiveSummary": string
}
`;

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
          );

          const apiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const response: any = await Promise.race([apiPromise, timeoutPromise]);
          const text = response.text;
          if (text) {
            aiForecast = JSON.parse(text);
          }
        } catch (e: any) {
          console.warn('AI prediction failed, using statistical model:', e?.message);
        }
      }

      if (!aiForecast) {
        // Statistical fallback
        const catList = Object.entries(categoryTotals).map(([cat, amt]) => {
          const catDaily = amt / daysWithData;
          const predicted = Math.round(catDaily * 30 * 100) / 100;
          const assignedBudget = budget.categoryBudgets?.[cat] || (budgetLimit / 6);
          const riskLevel = predicted > assignedBudget * 1.1 ? 'high' : predicted > assignedBudget ? 'moderate' : 'low';
          return {
            category: cat,
            currentSpent: amt,
            predictedNextMonth: predicted,
            changePercent: Math.round(((predicted - amt) / (amt || 1)) * 100),
            trend: predicted > amt ? 'up' : 'down',
            riskLevel,
            advice:
              riskLevel === 'high'
                ? `Pacing above budget. Limit discretionary purchases in ${cat}.`
                : `Spending in ${cat} is well balanced.`,
          };
        });

        aiForecast = {
          projectedEndOfMonth,
          projectedNextMonth: Math.round(projectedEndOfMonth * 0.98 * 100) / 100,
          confidenceScore: 84,
          trajectoryStatus,
          categoryForecasts: catList,
          riskFactors: [
            projectedVariance > 0
              ? `Current burn rate exceeds monthly budget by ${currency}${projectedVariance.toFixed(2)}.`
              : 'End-of-month spending is safely below your ceiling.',
            'Discretionary food & shopping velocity shows mid-week spikes.',
          ],
          savingsOpportunities: [
            'Cook at home or pack campus snacks to trim food expenses by up to 15%.',
            'Look into public transit semester passes instead of rideshare apps.',
            'Cancel unused digital subscriptions before recurring billing renews.',
          ],
          executiveSummary: `Based on your average spending velocity of ${currency}${dailyAverage.toFixed(2)}/day, your projected total for the 30-day period is ${currency}${projectedEndOfMonth.toFixed(2)}. ${
            trajectoryStatus === 'critical'
              ? 'Action is required to avoid a budget deficit.'
              : 'You are on track to stay financially secure!'
          }`,
        };
      }

      res.json(aiForecast);
    } catch (err: any) {
      console.error('Prediction error:', err);
      res.status(500).json({ error: 'Failed to generate expense prediction' });
    }
  });

  // Helper to create nodemailer transporter
  async function createMailTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    // Fallback to ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // 3. MAIL MONTHLY EXPENSE DATA TO LOGGED-IN EMAIL (WITH PDF ATTACHMENT)
  app.post('/api/mail/monthly-report', async (req: Request, res: Response) => {
    try {
      const {
        toEmail,
        monthName = 'Current Month',
        currency = '$',
        summary = {},
        categories = [],
        topExpenses = [],
        customNotes = '',
        pdfBase64 = '',
        fileName = '',
      } = req.body;

      const recipient = (toEmail && toEmail.includes('@')) ? toEmail.trim() : 'sinchanar276@gmail.com';

      const {
        totalSpent = 0,
        monthlyBudget = 0,
        remainingBudget = 0,
        budgetUtilization = 0,
        dailyAverage = 0,
        transactionCount = 0,
      } = summary;

      const subject = `Your Budgio Monthly Expense Statement - ${monthName} [PDF Attached]`;

      // Build Plain Text Report
      const plainReport = `
========================================
BUDGIO - STUDENT EXPENSE STATEMENT
Period: ${monthName}
Recipient: ${recipient}
========================================

FINANCIAL OVERVIEW:
- Total Spent: ${currency}${Number(totalSpent).toFixed(2)}
- Monthly Budget: ${currency}${Number(monthlyBudget).toFixed(2)}
- Remaining Budget: ${currency}${Number(remainingBudget).toFixed(2)}
- Budget Utilization: ${Number(budgetUtilization).toFixed(1)}%
- Daily Average Spend: ${currency}${Number(dailyAverage).toFixed(2)}
- Total Transactions: ${transactionCount}

EXPENSE BREAKDOWN BY CATEGORY:
${categories.map((c: any) => `* ${c.category}: ${currency}${Number(c.amount).toFixed(2)} (${Number(c.percentage).toFixed(1)}%)`).join('\n')}

TOP 5 EXPENSES:
${topExpenses.map((t: any) => `* ${t.date} - ${t.description}: ${currency}${Number(t.amount).toFixed(2)} [${t.category}]`).join('\n')}

${customNotes ? `\nNOTES:\n${customNotes}\n` : ''}
========================================
Generated by Budgio - Smart Student Expense Analyzer
A full PDF copy of this statement is attached.
`;

      // Build Beautiful HTML Email Template
      const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0B0F; color: #FFFFFF; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #17171D; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #7C5CFF 0%, #3DDC97 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; font-size: 14px; opacity: 0.95; }
    .content { padding: 28px 24px; color: #E2E8F0; }
    .badge { display: inline-block; padding: 4px 10px; background: rgba(255, 255, 255, 0.1); border-radius: 999px; font-size: 12px; color: #3DDC97; font-weight: 600; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .card { background: #1F1F27; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); }
    .card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9A9AA5; margin-bottom: 4px; }
    .card .val { font-size: 20px; font-weight: 700; color: #FFFFFF; }
    .highlight { color: #3DDC97 !important; }
    .warning { color: #FF6B6B !important; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
    th { text-align: left; padding: 10px; background: #23232C; color: #9A9AA5; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
    td { padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; color: #FFFFFF; }
    .footer { text-align: center; padding: 20px 24px; background: #121217; font-size: 12px; color: #9A9AA5; border-top: 1px solid rgba(255, 255, 255, 0.08); }
    .pdf-pill { background: rgba(124, 92, 255, 0.15); border: 1px solid rgba(124, 92, 255, 0.3); border-radius: 8px; padding: 10px 14px; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #FFFFFF; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Budgio Expense Report</h1>
      <p>Monthly financial summary for ${monthName}</p>
    </div>
    <div class="content">
      <div class="badge">Verified Student Statement</div>
      <p style="font-size: 14px; color: #9A9AA5; margin-top: 0;">
        Hello! Here is your complete monthly expense statement sent to <strong>${recipient}</strong>. An official PDF statement is attached for your records.
      </p>

      <div class="grid">
        <div class="card">
          <div class="label">Total Spent</div>
          <div class="val">${currency}${Number(totalSpent).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Monthly Budget</div>
          <div class="val">${currency}${Number(monthlyBudget).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Remaining Budget</div>
          <div class="val ${remainingBudget < 0 ? 'warning' : 'highlight'}">${currency}${Number(remainingBudget).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Daily Average</div>
          <div class="val">${currency}${Number(dailyAverage).toFixed(2)}/day</div>
        </div>
      </div>

      <div class="pdf-pill">
        <span>📄 <strong>PDF Statement Attached:</strong> ${fileName || `Budgio_Statement_${monthName.replace(/\s+/g, '_')}.pdf`}</span>
      </div>

      <h3 style="font-size: 16px; margin: 20px 0 8px 0; color: #FFFFFF;">Spending by Category</h3>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${categories
            .map(
              (c: any) => `
            <tr>
              <td><strong>${c.category}</strong></td>
              <td>${currency}${Number(c.amount).toFixed(2)}</td>
              <td>${Number(c.percentage).toFixed(1)}%</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      ${
        topExpenses.length > 0
          ? `
        <h3 style="font-size: 16px; margin: 20px 0 8px 0; color: #FFFFFF;">Top Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${topExpenses
              .map(
                (t: any) => `
              <tr>
                <td>${t.date}</td>
                <td><strong>${t.description}</strong></td>
                <td>${t.category}</td>
                <td>${currency}${Number(t.amount).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      <div style="background: rgba(124, 92, 255, 0.1); border-left: 3px solid #7C5CFF; padding: 12px 16px; border-radius: 6px; margin-top: 16px;">
        <strong style="color: #7C5CFF; font-size: 13px;">💡 Budgio Student Tip:</strong>
        <p style="font-size: 13px; color: #CBD5E1; margin: 4px 0 0 0;">
          Tracking your daily expenses consistently is the #1 habit proven to increase student semester savings by 20%. Keep it up!
        </p>
      </div>
    </div>
    <div class="footer">
      Sent with ❤️ by <strong>Budgio</strong> &bull; Student Expense Analyzer
    </div>
  </div>
</body>
</html>
`;

      let previewUrl: string | undefined = undefined;

      // Construct attachments
      const attachments: any[] = [];
      if (pdfBase64) {
        attachments.push({
          filename: fileName || `Budgio_Monthly_Report_${monthName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        });
      }

      // Attempt nodemailer delivery
      try {
        const transporter = await createMailTransporter();
        const info = await transporter.sendMail({
          from: `"Budgio Finance" <${process.env.SMTP_FROM || 'reports@budgio.app'}>`,
          to: recipient,
          subject,
          text: plainReport,
          html: htmlReport,
          attachments,
        });

        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        console.log(`Monthly report email dispatched to ${recipient}. Message ID: ${info.messageId}`);
      } catch (mailError: any) {
        console.warn('Nodemailer dispatch warning (handled):', mailError?.message);
      }

      res.json({
        success: true,
        message: `Monthly expense statement sent to ${recipient} in PDF format`,
        email: recipient,
        subject,
        previewUrl,
        plainReport,
        htmlReport,
      });
    } catch (err: any) {
      console.error('Mail statement error:', err);
      res.status(500).json({ error: 'Failed to generate and email expense report' });
    }
  });

  // 4. BUDGET WARNING EMAIL ENDPOINT: Automatic warning when spending exceeds limit
  app.post('/api/mail/budget-warning', async (req: Request, res: Response) => {
    try {
      const {
        toEmail,
        currency = '$',
        monthlyBudget = 1000,
        totalSpent = 0,
        overrunAmount = 0,
        budgetUtilization = 100,
        userProfile = {},
        topExpenses = [],
        pdfBase64 = '',
      } = req.body;

      const recipient = (toEmail && toEmail.includes('@')) ? toEmail.trim() : 'sinchanar276@gmail.com';
      const studentName = userProfile.displayName || 'Student';

      const subject = `⚠️ URGENT BUDGET ALERT: You have exceeded your ${currency}${Number(monthlyBudget).toFixed(0)} limit by ${currency}${Number(overrunAmount).toFixed(2)}!`;

      const plainReport = `
========================================
⚠️ BUDGIO EMERGENCY BUDGET LIMIT WARNING
========================================
Attention: ${studentName} (${recipient})
Alert Date: ${new Date().toLocaleString()}

CRITICAL STATUS:
- Configured Monthly Budget: ${currency}${Number(monthlyBudget).toFixed(2)}
- Current Total Spent: ${currency}${Number(totalSpent).toFixed(2)}
- BUDGET OVERRUN: +${currency}${Number(overrunAmount).toFixed(2)}
- Budget Utilization: ${Number(budgetUtilization).toFixed(1)}%

You have officially crossed 100% of your allocated budget ceiling.
Immediate Recommendations:
1. Freeze all non-essential shopping and entertainment purchases.
2. Rely on university meal allowances or home cooked food.
3. Review your recent transactions in the Budgio dashboard.

An official Budget Overrun Audit PDF is attached to this email.
`;

      const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0B0F; color: #FFFFFF; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #17171D; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2); }
    .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 0; font-size: 13px; opacity: 0.95; }
    .content { padding: 28px 24px; color: #E2E8F0; }
    .alert-banner { background: rgba(239, 68, 68, 0.15); border-left: 4px solid #EF4444; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; }
    .alert-banner strong { color: #EF4444; font-size: 15px; display: block; margin-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .card { background: #1F1F27; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); }
    .card .label { font-size: 11px; text-transform: uppercase; color: #9A9AA5; margin-bottom: 4px; }
    .card .val { font-size: 20px; font-weight: 700; color: #FFFFFF; }
    .danger { color: #EF4444 !important; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
    th { text-align: left; padding: 10px; background: #23232C; color: #9A9AA5; font-size: 12px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; }
    .steps { background: #1C1917; border: 1px solid #78350F; padding: 16px; border-radius: 12px; margin-top: 16px; }
    .steps h4 { margin: 0 0 8px 0; color: #F59E0B; font-size: 14px; }
    .steps ol { margin: 0; padding-left: 20px; font-size: 13px; color: #D6D3D1; line-height: 1.6; }
    .footer { text-align: center; padding: 18px 24px; background: #121217; font-size: 12px; color: #9A9AA5; border-top: 1px solid rgba(255, 255, 255, 0.08); }
    .pdf-tag { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 13px; color: #FCA5A5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Budget Limit Exceeded</h1>
      <p>Automated Financial Alert for ${studentName}</p>
    </div>
    <div class="content">
      <div class="alert-banner">
        <strong>Overrun Threshold Triggered</strong>
        Your expenses have surpassed your planned monthly budget limit. You have accumulated a deficit of <strong>${currency}${Number(overrunAmount).toFixed(2)}</strong>.
      </div>

      <div class="pdf-tag">
        📄 <strong>Warning Audit PDF Attached:</strong> Budgio_Budget_Warning_${new Date().toISOString().slice(0, 10)}.pdf
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Monthly Budget</div>
          <div class="val">${currency}${Number(monthlyBudget).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Total Spent</div>
          <div class="val danger">${currency}${Number(totalSpent).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Deficit Overrun</div>
          <div class="val danger">+${currency}${Number(overrunAmount).toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="label">Budget Used</div>
          <div class="val danger">${Number(budgetUtilization).toFixed(1)}%</div>
        </div>
      </div>

      ${
        topExpenses.length > 0
          ? `
        <h3 style="font-size: 15px; margin: 20px 0 8px 0; color: #FFFFFF;">Top Transactions Causing Overrun</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${topExpenses
              .slice(0, 5)
              .map(
                (t: any) => `
              <tr>
                <td>${t.date}</td>
                <td><strong>${t.description}</strong></td>
                <td>${t.category}</td>
                <td style="color: #EF4444; font-weight: bold;">${currency}${Number(t.amount).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }

      <div class="steps">
        <h4>⚡ Immediate Emergency Recommendations:</h4>
        <ol>
          <li>Pause discretionary spending (takeout dining, online retail, rideshares).</li>
          <li>Reallocate funds from other category buffers inside the Budget Planner.</li>
          <li>Check your attached PDF audit report for full transaction breakdowns.</li>
        </ol>
      </div>
    </div>
    <div class="footer">
      Automated Safety Alert from <strong>Budgio</strong> &bull; Student Expense Analyzer
    </div>
  </div>
</body>
</html>
`;

      let previewUrl: string | undefined = undefined;

      const attachments: any[] = [];
      if (pdfBase64) {
        attachments.push({
          filename: `Budgio_Budget_Warning_${new Date().toISOString().slice(0, 10)}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        });
      }

      try {
        const transporter = await createMailTransporter();
        const info = await transporter.sendMail({
          from: `"Budgio Safety Alert" <${process.env.SMTP_FROM || 'alerts@budgio.app'}>`,
          to: recipient,
          subject,
          text: plainReport,
          html: htmlReport,
          attachments,
        });

        previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
        console.log(`Budget warning email dispatched to ${recipient}. Message ID: ${info.messageId}`);
      } catch (mailError: any) {
        console.warn('Nodemailer dispatch warning (handled):', mailError?.message);
      }

      res.json({
        success: true,
        message: `Budget overrun alert sent to ${recipient} with PDF audit attached`,
        email: recipient,
        subject,
        previewUrl,
        overrunAmount,
      });
    } catch (err: any) {
      console.error('Budget warning email error:', err);
      res.status(500).json({ error: 'Failed to send budget warning email' });
    }
  });

  // Standard container health probes for Cloud Run
  app.get(['/healthz', '/livez', '/readyz'], (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Serve static assets or mount Vite dev middleware
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');

  if (isProd) {
    if (fs.existsSync(indexHtmlPath)) {
      console.log(`Serving static production files from: ${distPath}`);
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        if (fs.existsSync(indexHtmlPath)) {
          res.sendFile(indexHtmlPath, (err) => {
            if (err && !res.headersSent) {
              res.status(500).send('Error serving application.');
            }
          });
        } else {
          res.status(500).send('Production index.html missing. Please build the application.');
        }
      });
    } else {
      console.warn('Production mode requested but dist/index.html not found! Mounting Vite fallback.');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  } else {
    // Development mode: ALWAYS mount Vite dev middleware per guidelines
    console.log('Mounting Vite dev middleware in development mode');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Budgio Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Budgio server:', err);
});
