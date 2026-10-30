import { Transaction } from '../types';

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    date: '2026-10-01',
    description: 'Dorm Monthly Rent & Maintenance',
    amount: 450.00,
    category: 'Accommodation',
    source: 'Bank Transfer',
    notes: 'Campus quad shared dorm',
  },
  {
    id: 'tx-102',
    date: '2026-10-02',
    description: 'University Bookstore - CS Algorithms & Lab Manual',
    amount: 118.50,
    category: 'Education',
    source: 'Campus Card',
    notes: 'Required semester textbooks',
  },
  {
    id: 'tx-103',
    date: '2026-10-04',
    description: 'Monthly Subway & City Transit Pass',
    amount: 55.00,
    category: 'Transport',
    source: 'Debit Card',
  },
  {
    id: 'tx-104',
    date: '2026-10-05',
    description: 'Trader Joe\'s Grocery Haul (Oatmeal, Eggs, Fruit)',
    amount: 64.20,
    category: 'Food',
    source: 'Debit Card',
  },
  {
    id: 'tx-105',
    date: '2026-10-07',
    description: 'Campus Cafeteria Lunch Bowl & Cold Brew',
    amount: 14.80,
    category: 'Food',
    source: 'Campus Card',
  },
  {
    id: 'tx-106',
    date: '2026-10-08',
    description: 'Spotify Student + Hulu Bundle',
    amount: 5.99,
    category: 'Entertainment',
    source: 'Online',
  },
  {
    id: 'tx-107',
    date: '2026-10-10',
    description: 'Chegg Study Monthly Homework Subscription',
    amount: 15.95,
    category: 'Education',
    source: 'Online',
  },
  {
    id: 'tx-108',
    date: '2026-10-12',
    description: 'Late Night Pizza Slice & Boba with Study Group',
    amount: 18.50,
    category: 'Food',
    source: 'Cash',
  },
  {
    id: 'tx-109',
    date: '2026-10-14',
    description: 'Uber Ride to Airport for Fall Break Trip',
    amount: 32.40,
    category: 'Transport',
    source: 'Online',
  },
  {
    id: 'tx-110',
    date: '2026-10-16',
    description: 'Amazon Prime Student - Desk Study Lamp & Notebooks',
    amount: 42.99,
    category: 'Shopping',
    source: 'Online',
  },
  {
    id: 'tx-111',
    date: '2026-10-18',
    description: 'Campus WiFi & Laundry Card Reload',
    amount: 25.00,
    category: 'Accommodation',
    source: 'Campus Card',
  },
  {
    id: 'tx-112',
    date: '2026-10-20',
    description: 'Campus Cinema Weekend Movie Ticket + Popcorn',
    amount: 16.00,
    category: 'Entertainment',
    source: 'Debit Card',
  },
  {
    id: 'tx-113',
    date: '2026-10-22',
    description: 'Whole Foods Dorm Groceries & Snacks',
    amount: 52.30,
    category: 'Food',
    source: 'Debit Card',
  },
  {
    id: 'tx-114',
    date: '2026-10-24',
    description: 'Target Winter Hoodie & Thermal Socks',
    amount: 38.50,
    category: 'Shopping',
    source: 'Debit Card',
  },
  {
    id: 'tx-115',
    date: '2026-10-26',
    description: 'Campus Printing & Lab Report Binding',
    amount: 8.75,
    category: 'Education',
    source: 'Campus Card',
  },
  {
    id: 'tx-116',
    date: '2026-10-28',
    description: 'Chipotle Burrito Bowl with Guac',
    amount: 13.90,
    category: 'Food',
    source: 'Debit Card',
  },
  {
    id: 'tx-117',
    date: '2026-10-27',
    description: 'Campus Health Center & Pharmacy - Allergy Meds',
    amount: 32.50,
    category: 'Health',
    source: 'Campus Card',
    notes: 'Student health center copay',
  },
];

export const SAMPLE_CSV_CONTENT = `Date,Description,Amount,Category,Source
2026-10-01,Dorm Room Monthly Rent,450.00,Accommodation,Bank Transfer
2026-10-02,Textbooks - Organic Chemistry,89.50,Education,Campus Card
2026-10-03,Student Monthly Transit Card,55.00,Transport,Debit Card
2026-10-05,Trader Joes Groceries,62.40,Food,Debit Card
2026-10-06,Campus Coffee and Bagel,7.80,Food,Campus Card
2026-10-08,Spotify Student Subscription,5.99,Entertainment,Online
2026-10-10,Amazon Desk Organizer & Notebooks,29.99,Shopping,Online
2026-10-12,Uber to Science Laboratory,14.50,Transport,Debit Card
2026-10-15,Dining Hall Meal Pack,45.00,Food,Campus Card
2026-10-18,Chegg Study Pack,15.95,Education,Online
2026-10-21,Dorm Laundry and Electricity Share,30.00,Accommodation,Cash
2026-10-24,Weekend Movie and Snacks,19.50,Entertainment,Debit Card
2026-10-26,Campus Pharmacy Allergy Meds,32.50,Health,Campus Card
2026-10-28,Chipotle Lunch Bowl,13.40,Food,Debit Card`;

export function downloadSampleCSV(): void {
  const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'student_expenses_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Source', 'Notes'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.category,
    t.source,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `student_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
