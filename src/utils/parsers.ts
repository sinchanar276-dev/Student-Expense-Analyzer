import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ExpenseCategory, Transaction } from '../types';
import { categorizeDescription } from './categorizer';

export interface ParsedRawItem {
  date?: string;
  description: string;
  amount: number;
  category?: ExpenseCategory;
  source?: string;
  raw?: string;
}

// Clean and extract numeric amount from string
export function parseAmount(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

// Normalize date to YYYY-MM-DD
export function normalizeDate(val: any): string {
  if (!val) {
    return new Date().toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  // Check if standard ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Check MM/DD/YYYY or DD/MM/YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    let y = parts[2];
    let m = parts[0];
    let d = parts[1];
    if (y.length === 2) y = '20' + y;
    if (parts[0].length === 4) {
      y = parts[0];
      m = parts[1];
      d = parts[2];
    }
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  const dateObj = new Date(val);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

// CSV Parser
export function parseCSVFile(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = [];
          const rows = results.data as Record<string, any>[];

          rows.forEach((row, index) => {
            // Find key names dynamically
            const keys = Object.keys(row);
            const dateKey = keys.find(k => /date|time|day/i.test(k));
            const descKey = keys.find(k => /desc|narrative|particular|payee|item|merchant|name/i.test(k));
            const amountKey = keys.find(k => /amount|cost|price|debit|expense|val/i.test(k));
            const catKey = keys.find(k => /category|type|tag/i.test(k));
            const sourceKey = keys.find(k => /source|account|method|payment/i.test(k));

            const desc = descKey ? String(row[descKey] || '').trim() : (row[keys[1]] || `Expense #${index + 1}`);
            const rawAmount = amountKey ? row[amountKey] : (row[keys[2]] || 0);
            const amount = parseAmount(rawAmount);

            if (!desc && amount === 0) return;

            const date = normalizeDate(dateKey ? row[dateKey] : null);
            const userCategory = catKey && row[catKey] ? String(row[catKey]).trim() : '';
            const category: ExpenseCategory = (['Food', 'Transport', 'Education', 'Accommodation', 'Shopping', 'Entertainment', 'Others'].includes(userCategory)
              ? userCategory as ExpenseCategory
              : categorizeDescription(desc));

            const source = sourceKey && row[sourceKey] ? String(row[sourceKey]).trim() : 'CSV Upload';

            transactions.push({
              id: `csv-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
              date,
              description: desc || 'Imported Expense',
              amount,
              category,
              source,
            });
          });

          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
}

// Excel (.xlsx) Parser
export async function parseExcelFile(file: File): Promise<Transaction[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const transactions: Transaction[] = [];

  jsonRows.forEach((row, index) => {
    const keys = Object.keys(row);
    const dateKey = keys.find(k => /date|time|day/i.test(k));
    const descKey = keys.find(k => /desc|particular|payee|item|merchant|name/i.test(k));
    const amountKey = keys.find(k => /amount|cost|price|debit|expense|val/i.test(k));
    const catKey = keys.find(k => /category|type/i.test(k));
    const sourceKey = keys.find(k => /source|account|method/i.test(k));

    const desc = descKey ? String(row[descKey]).trim() : (row[keys[1]] || `Expense #${index + 1}`);
    const amount = parseAmount(amountKey ? row[amountKey] : row[keys[2]]);

    if (!desc && amount === 0) return;

    let date = normalizeDate(dateKey ? row[dateKey] : null);
    // If excel serial date
    if (typeof row[dateKey || ''] === 'number') {
      const parsedDate = XLSX.SSF.parse_date_code(row[dateKey || '']);
      if (parsedDate) {
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        date = `${parsedDate.y}-${m}-${d}`;
      }
    }

    const userCat = catKey && row[catKey] ? String(row[catKey]).trim() : '';
    const category: ExpenseCategory = (['Food', 'Transport', 'Education', 'Accommodation', 'Shopping', 'Entertainment', 'Others'].includes(userCat)
      ? userCat as ExpenseCategory
      : categorizeDescription(desc));

    const source = sourceKey && row[sourceKey] ? String(row[sourceKey]).trim() : 'Excel (.xlsx)';

    transactions.push({
      id: `xlsx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      date,
      description: desc || 'Excel Expense',
      amount,
      category,
      source,
    });
  });

  return transactions;
}

// Quick Paste Text Parser
// Supports: "Lunch 150", "Bus 40", "Books 500", "2026-10-14 Chipotle 12.50", "Subway, 4.50, Food"
export function parsePastedExpenses(rawText: string): ParsedRawItem[] {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ParsedRawItem[] = [];

  for (const line of lines) {
    // Pattern 1: Comma or tab separated
    if (line.includes(',') || line.includes('\t')) {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      // Check if first is date
      let date = new Date().toISOString().slice(0, 10);
      let desc = '';
      let amount = 0;
      let category: ExpenseCategory | undefined = undefined;

      if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/-]\d{1,2}/.test(parts[0])) {
        date = normalizeDate(parts[0]);
        desc = parts[1] || '';
        amount = parseAmount(parts[2]);
        if (parts[3]) category = parts[3] as ExpenseCategory;
      } else {
        desc = parts[0] || '';
        amount = parseAmount(parts[1]);
        if (parts[2]) category = parts[2] as ExpenseCategory;
      }

      if (desc || amount > 0) {
        items.push({
          date,
          description: desc || 'Pasted Item',
          amount,
          category: category || categorizeDescription(desc),
          source: 'Quick Paste',
          raw: line,
        });
        continue;
      }
    }

    // Pattern 2: Space separated: e.g. "Lunch 150", "Bus ride 40", "2026-10-20 Boba tea 7.50"
    // Find amount at end or beginning
    const tokens = line.split(/\s+/);
    if (tokens.length >= 2) {
      // Check if last token is number
      const lastToken = tokens[tokens.length - 1];
      const parsedAmt = parseAmount(lastToken);

      if (parsedAmt > 0 || lastToken === '0') {
        const remainingTokens = tokens.slice(0, -1);
        let date = new Date().toISOString().slice(0, 10);

        // Check if first token is date
        if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/-]\d{1,2}/.test(remainingTokens[0])) {
          date = normalizeDate(remainingTokens[0]);
          remainingTokens.shift();
        }

        const desc = remainingTokens.join(' ').replace(/[-:]+$/, '').trim();
        items.push({
          date,
          description: desc || 'Pasted Expense',
          amount: parsedAmt,
          category: categorizeDescription(desc),
          source: 'Quick Paste',
          raw: line,
        });
        continue;
      }
    }

    // Fallback: extract any digits
    const numMatch = line.match(/[$₹€£]?\s*(\d+(?:\.\d{1,2})?)/);
    if (numMatch) {
      const amt = parseFloat(numMatch[1]);
      const desc = line.replace(numMatch[0], '').trim() || 'Expense';
      items.push({
        date: new Date().toISOString().slice(0, 10),
        description: desc,
        amount: amt,
        category: categorizeDescription(desc),
        source: 'Quick Paste',
        raw: line,
      });
    }
  }

  return items;
}

// PDF Text Statement parser
export function parseBankStatementText(text: string): ParsedRawItem[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ParsedRawItem[] = [];

  // Match: YYYY-MM-DD or MM/DD/YYYY + Description + Amount
  const regex = /(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+[$₹€£]?\s*(\d+(?:\.\d{2})?)(?:\s|$)/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const date = normalizeDate(match[1]);
      const desc = match[2].trim();
      const amount = parseFloat(match[3]);
      if (amount > 0) {
        items.push({
          date,
          description: desc,
          amount,
          category: categorizeDescription(desc),
          source: 'PDF Statement',
          raw: line,
        });
      }
    }
  }

  return items;
}
