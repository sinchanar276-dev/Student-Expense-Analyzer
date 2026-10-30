import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, BudgetConfig, ExpenseCategory } from '../types';

export interface UserProfileInfo {
  displayName?: string;
  email?: string;
  university?: string;
  major?: string;
  monthlyAllowance?: number;
}

export interface MonthlyReportData {
  monthName: string;
  currency: string;
  summary: {
    totalSpent: number;
    monthlyBudget: number;
    remainingBudget: number;
    budgetUtilization: number;
    dailyAverage: number;
    transactionCount: number;
  };
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  transactions: Transaction[];
  userProfile?: UserProfileInfo;
  savingsGoal?: {
    name: string;
    savedAmount: number;
    targetAmount: number;
  };
  customNotes?: string;
}

export interface BudgetWarningData {
  currency: string;
  monthlyBudget: number;
  totalSpent: number;
  overrunAmount: number;
  budgetUtilization: number;
  userProfile?: UserProfileInfo;
  exceededCategories?: Array<{
    category: string;
    spent: number;
    limit: number;
    overrun: number;
  }>;
  topExpenses: Transaction[];
  alertDate: string;
}

/**
 * Generates a full, professional PDF Monthly Statement
 */
export function generateMonthlyExpensePDF(data: MonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || '$';
  const email = data.userProfile?.email || 'sinchanar276@gmail.com';
  const studentName = data.userProfile?.displayName || 'Student User';

  // --- Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 85, 'F');

  // Accent gradient line
  doc.setFillColor(124, 92, 255); // #7C5CFF
  doc.rect(0, 85, pageWidth, 4, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BUDGIO', 36, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(61, 220, 151); // #3DDC97
  doc.text('Smart Student Expense Analyzer', 36, 58);

  // Statement Meta on Right
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MONTHLY EXPENSE STATEMENT', pageWidth - 36, 38, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`Period: ${data.monthName}`, pageWidth - 36, 52, { align: 'right' });
  doc.text(`Issued: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, pageWidth - 36, 65, { align: 'right' });

  let y = 105;

  // --- Student Profile Card ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(36, y, pageWidth - 72, 54, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('STUDENT PROFILE', 48, y + 16);
  doc.text('RECIPIENT EMAIL', 240, y + 16);
  doc.text('STATUS', pageWidth - 48, y + 16, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, 48, y + 34);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(email, 240, y + 34);

  doc.setFontSize(9);
  const isOverBudget = data.summary.totalSpent > data.summary.monthlyBudget;
  if (isOverBudget) {
    doc.setTextColor(220, 38, 38);
    doc.text('• OVER BUDGET', pageWidth - 48, y + 34, { align: 'right' });
  } else {
    doc.setTextColor(22, 163, 74);
    doc.text('• HEALTHY', pageWidth - 48, y + 34, { align: 'right' });
  }

  y += 66;

  // --- Over-budget alert box if applicable ---
  if (isOverBudget) {
    const overrun = data.summary.totalSpent - data.summary.monthlyBudget;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(36, y, pageWidth - 72, 34, 4, 4, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`⚠️ BUDGET OVERRUN ALERT: You have exceeded your monthly limit by ${currency}${overrun.toFixed(2)} (${data.summary.budgetUtilization.toFixed(1)}% used)`, 48, y + 21);
    y += 44;
  }

  // --- 4 Financial Overview Metric Cards ---
  const cardWidth = (pageWidth - 72 - 30) / 4;
  const metrics = [
    { label: 'TOTAL SPENT', value: `${currency}${data.summary.totalSpent.toFixed(2)}`, color: [15, 23, 42] },
    { label: 'MONTHLY BUDGET', value: `${currency}${data.summary.monthlyBudget.toFixed(2)}`, color: [15, 23, 42] },
    {
      label: isOverBudget ? 'DEFICIT' : 'REMAINING',
      value: `${currency}${Math.abs(data.summary.remainingBudget).toFixed(2)}`,
      color: isOverBudget ? [220, 38, 38] : [22, 163, 74],
    },
    { label: 'DAILY AVERAGE', value: `${currency}${data.summary.dailyAverage.toFixed(2)}/d`, color: [124, 92, 255] },
  ];

  metrics.forEach((m, i) => {
    const xPos = 36 + i * (cardWidth + 10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xPos, y, cardWidth, 48, 4, 4, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, xPos + 10, y + 16);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, xPos + 10, y + 36);
  });

  y += 60;

  // --- Spending by Category Section ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Spending by Category', 36, y);

  y += 8;

  const categoryTableData = data.categories.map((c) => [
    c.category,
    `${currency}${Number(c.amount).toFixed(2)}`,
    `${Number(c.percentage).toFixed(1)}%`,
    c.amount > (data.summary.monthlyBudget / 4) ? 'High' : 'Normal',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount Spent', 'Share of Total', 'Velocity']],
    body: categoryTableData,
    theme: 'striped',
    margin: { left: 36, right: 36 },
    headStyles: {
      fillColor: [124, 92, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
    },
  });

  // Get final Y after table
  y = (doc as any).lastAutoTable.finalY + 20;

  // --- Savings Goal Progress if present ---
  if (data.savingsGoal) {
    const goal = data.savingsGoal;
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;

    doc.setFillColor(245, 243, 255); // Light purple
    doc.setDrawColor(196, 181, 253);
    doc.roundedRect(36, y, pageWidth - 72, 38, 4, 4, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217);
    doc.text(`🎯 SAVINGS GOAL: ${goal.name}`, 48, y + 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Saved: ${currency}${goal.savedAmount.toFixed(2)} of ${currency}${goal.targetAmount.toFixed(2)} (${pct}% completed)`,
      48,
      y + 28
    );

    y += 48;
  }

  // --- Transactions Detail Table ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detailed Transaction Ledger', 36, y);

  y += 8;

  const txRows = data.transactions.slice(0, 30).map((t) => [
    t.date,
    t.description,
    t.category,
    t.source,
    `${currency}${Number(t.amount).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Category', 'Source', 'Amount']],
    body: txRows,
    theme: 'grid',
    margin: { left: 36, right: 36 },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 85 },
      3: { cellWidth: 80 },
      4: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer on each page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Budgio Student Expense Analyzer • Generated for ${email} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  // Base64 string for nodemailer attachment (strip header)
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';
  const blob = doc.output('blob');

  return { doc, blob, base64 };
}

/**
 * Generates an Urgent Budget Warning Alert PDF
 */
export function generateBudgetWarningPDF(data: BudgetWarningData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currency = data.currency || '$';
  const email = data.userProfile?.email || 'sinchanar276@gmail.com';
  const studentName = data.userProfile?.displayName || 'Student User';

  // --- Header Alert Banner ---
  doc.setFillColor(185, 28, 28); // Bold Red
  doc.rect(0, 0, pageWidth, 90, 'F');

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BUDGIO', 36, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 202, 202);
  doc.text('Automated Student Financial Safety Guard', 36, 58);

  // Warning Label
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('⚠️ BUDGET LIMIT EXCEEDED WARNING', pageWidth - 36, 38, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 202, 202);
  doc.text(`Triggered: ${data.alertDate}`, pageWidth - 36, 54, { align: 'right' });
  doc.text(`Recipient: ${email}`, pageWidth - 36, 68, { align: 'right' });

  let y = 110;

  // --- Urgent Notice Banner ---
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(36, y, pageWidth - 72, 60, 6, 6, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('CRITICAL NOTICE: MONTHLY SPENDING CEILING SURPASSED', 48, y + 22);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(69, 10, 10);
  doc.text(
    `Dear ${studentName}, your total recorded expenditure has exceeded your configured monthly budget by ${currency}${data.overrunAmount.toFixed(2)}.`,
    48,
    y + 38
  );
  doc.text(
    `Your current budget utilization is at ${data.budgetUtilization.toFixed(1)}%. Non-essential spending should be paused immediately.`,
    48,
    y + 50
  );

  y += 76;

  // --- Overrun Key Figures ---
  const cardWidth = (pageWidth - 72 - 20) / 3;
  const cards = [
    { label: 'MONTHLY BUDGET LIMIT', val: `${currency}${data.monthlyBudget.toFixed(2)}`, col: [71, 85, 105] },
    { label: 'TOTAL SPENT TO DATE', val: `${currency}${data.totalSpent.toFixed(2)}`, col: [185, 28, 28] },
    { label: 'TOTAL DEFICIT OVERRUN', val: `+${currency}${data.overrunAmount.toFixed(2)}`, col: [220, 38, 38] },
  ];

  cards.forEach((c, idx) => {
    const x = 36 + idx * (cardWidth + 10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, 48, 4, 4, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 10, y + 16);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.col[0], c.col[1], c.col[2]);
    doc.text(c.val, x + 10, y + 36);
  });

  y += 64;

  // --- Actionable Remediation Tips for Student ---
  doc.setFillColor(255, 251, 235); // Amber 50
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(36, y, pageWidth - 72, 70, 4, 4, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('💡 RECOMMENDED EMERGENCY ACTIONS FOR STUDENTS:', 48, y + 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 53, 15);
  doc.text('1. Freeze Discretionary Shopping & Entertainment until the start of next month.', 48, y + 32);
  doc.text('2. Utilize campus meal cards and dining halls instead of takeout/restaurants.', 48, y + 44);
  doc.text('3. Use public transit student discount passes instead of rideshares (Uber/Lyft).', 48, y + 56);

  y += 84;

  // --- Top Overspending Transactions Table ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Top Contributors to Overrun', 36, y);

  y += 8;

  const topRows = data.topExpenses.slice(0, 10).map((t, idx) => [
    `#${idx + 1}`,
    t.date,
    t.description,
    t.category,
    `${currency}${t.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Date', 'Description', 'Category', 'Amount']],
    body: topRows,
    theme: 'striped',
    margin: { left: 36, right: 36 },
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 40, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 'auto', fontStyle: 'bold' },
      3: { cellWidth: 90 },
      4: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
    },
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Budgio Automated Safety Notification • Recipient: ${email} • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';
  const blob = doc.output('blob');

  return { doc, blob, base64 };
}
