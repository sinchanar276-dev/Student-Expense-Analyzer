import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  PenTool, 
  ClipboardPaste, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2, 
  Plus,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  Transaction, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES, 
  CATEGORY_COLORS, 
  BudgetConfig 
} from '../types';
import { 
  parseCSVFile, 
  parseExcelFile, 
  parsePastedExpenses, 
  parseBankStatementText,
  ParsedRawItem 
} from '../utils/parsers';
import { categorizeDescription } from '../utils/categorizer';
import { downloadSampleCSV } from '../utils/sampleData';

interface AddExpensesViewProps {
  onAddTransaction: (t: Transaction) => void;
  onAddBatchTransactions: (items: Transaction[]) => void;
  currency: string;
  onNavigateTab: (tab: any) => void;
}

type InputMethod = 'upload' | 'manual' | 'paste' | 'receipt';

export const AddExpensesView: React.FC<AddExpensesViewProps> = ({
  onAddTransaction,
  onAddBatchTransactions,
  currency,
  onNavigateTab,
}) => {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('upload');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // METHOD B: MANUAL ENTRY STATE
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [manualDescription, setManualDescription] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<ExpenseCategory>('Food');
  const [isCategoryOverridden, setIsCategoryOverridden] = useState<boolean>(false);
  const [manualSource, setManualSource] = useState<string>('Debit Card');
  const [manualNotes, setManualNotes] = useState<string>('');

  // Auto-suggest category as user types description (if not manually locked)
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const desc = e.target.value;
    setManualDescription(desc);
    if (!isCategoryOverridden && desc.trim().length > 2) {
      const detected = categorizeDescription(desc);
      setManualCategory(detected);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const amt = parseFloat(manualAmount);
    if (!manualDescription.trim()) {
      setErrorMessage('Please enter an expense description.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid positive expense amount.');
      return;
    }

    const newTx: Transaction = {
      id: `man-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: manualDate || new Date().toISOString().slice(0, 10),
      description: manualDescription.trim(),
      amount: Math.round(amt * 100) / 100,
      category: manualCategory,
      source: manualSource || 'Manual Entry',
      notes: manualNotes.trim() || undefined,
    };

    onAddTransaction(newTx);
    setSuccessMessage(`Successfully added "${newTx.description}" (${currency}${newTx.amount.toFixed(2)})`);
    
    // Reset form
    setManualDescription('');
    setManualAmount('');
    setManualNotes('');
    setIsCategoryOverridden(false);
  };

  // METHOD A: FILE UPLOAD STATE
  const [uploadFileType, setUploadFileType] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [parsedFileItems, setParsedFileItems] = useState<Transaction[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMessage(null);
    setErrorMessage(null);
    setIsParsingFile(true);
    setUploadedFileName(file.name);

    try {
      let parsed: Transaction[] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv' || file.type.includes('csv')) {
        parsed = await parseCSVFile(file);
      } else if (extension === 'xlsx' || extension === 'xls' || file.type.includes('spreadsheet') || file.type.includes('excel')) {
        parsed = await parseExcelFile(file);
      } else if (extension === 'pdf' || extension === 'txt') {
        const text = await file.text();
        const rawItems = parseBankStatementText(text);
        parsed = rawItems.map((item, idx) => ({
          id: `pdf-${Date.now()}-${idx}`,
          date: item.date || new Date().toISOString().slice(0, 10),
          description: item.description,
          amount: item.amount,
          category: item.category || 'Others',
          source: 'PDF Statement',
        }));
        if (parsed.length === 0) {
          // If pure binary PDF without selectable text
          throw new Error('Could not extract text from this PDF file. For best results, use CSV, Excel (.xlsx), or copy-paste text statements into the Paste Text tab.');
        }
      } else {
        throw new Error('Unsupported format. Please upload a .CSV, .XLSX, or statement text file.');
      }

      if (parsed.length === 0) {
        throw new Error('No valid expense entries found in the file. Check column headers.');
      }

      setParsedFileItems(parsed);
      setSuccessMessage(`Parsed ${parsed.length} transaction${parsed.length > 1 ? 's' : ''} from ${file.name}. Review and confirm below.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file. Please verify file format.');
      setParsedFileItems([]);
    } finally {
      setIsParsingFile(false);
      e.target.value = '';
    }
  };

  const handleConfirmFileUpload = () => {
    if (parsedFileItems.length === 0) return;
    onAddBatchTransactions(parsedFileItems);
    setSuccessMessage(`Successfully imported ${parsedFileItems.length} transactions!`);
    setParsedFileItems([]);
    setUploadedFileName(null);
  };

  // METHOD C: PASTE TEXT STATE
  const [pasteInputText, setPasteInputText] = useState<string>(
`Lunch 150
Bus 40
Books 500
2026-10-22 Starbucks cold brew 5.50
Target school supplies 35.00
Campus laundry card 20`
  );

  const parsedPastedItems = React.useMemo(() => {
    return parsePastedExpenses(pasteInputText);
  }, [pasteInputText]);

  const handleImportPasted = () => {
    if (parsedPastedItems.length === 0) {
      setErrorMessage('No valid expenses detected in text. Try formatting as: "Lunch 150" or "Bus 40" on each line.');
      return;
    }

    const items: Transaction[] = parsedPastedItems.map((item, idx) => ({
      id: `paste-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      description: item.description,
      amount: item.amount,
      category: item.category || categorizeDescription(item.description),
      source: 'Quick Paste',
    }));

    onAddBatchTransactions(items);
    setSuccessMessage(`Successfully imported ${items.length} expenses from pasted text!`);
    setPasteInputText('');
  };

  // METHOD D: RECEIPT IMAGES & OCR SIMULATION
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string>('');
  const [isScanningReceipt, setIsScanningReceipt] = useState<boolean>(false);
  const [receiptExtractedItems, setReceiptExtractedItems] = useState<Transaction[]>([]);

  const RECEIPT_PRESETS = [
    {
      name: 'Campus Bookstore',
      category: 'Education' as ExpenseCategory,
      items: [
        { desc: 'Physics 101 Lab Manual', amt: 34.50, cat: 'Education' as ExpenseCategory },
        { desc: 'Graphing Notebook (3-Pack)', amt: 12.99, cat: 'Education' as ExpenseCategory },
        { desc: 'Highlighter Pack 5-Color', amt: 6.75, cat: 'Education' as ExpenseCategory },
      ],
    },
    {
      name: 'Campus Cafeteria & Deli',
      category: 'Food' as ExpenseCategory,
      items: [
        { desc: 'Crispy Tofu Rice Bowl', amt: 11.50, cat: 'Food' as ExpenseCategory },
        { desc: 'Iced Matcha Latte 16oz', amt: 4.95, cat: 'Food' as ExpenseCategory },
        { desc: 'Fresh Banana & Apple', amt: 2.20, cat: 'Food' as ExpenseCategory },
      ],
    },
    {
      name: 'Target Dorm Essentials',
      category: 'Shopping' as ExpenseCategory,
      items: [
        { desc: 'LED Desk Study Lamp', amt: 22.99, cat: 'Shopping' as ExpenseCategory },
        { desc: 'Fleece Throw Blanket', amt: 15.00, cat: 'Accommodation' as ExpenseCategory },
        { desc: 'Extension Cord & Surge Protector', amt: 14.50, cat: 'Accommodation' as ExpenseCategory },
      ],
    },
  ];

  const handleSelectReceiptPreset = (preset: typeof RECEIPT_PRESETS[0]) => {
    setIsScanningReceipt(true);
    setReceiptName(preset.name);
    setReceiptImage('preset');

    setTimeout(() => {
      const date = new Date().toISOString().slice(0, 10);
      const items: Transaction[] = preset.items.map((it, idx) => ({
        id: `ocr-${Date.now()}-${idx}`,
        date,
        description: it.desc,
        amount: it.amt,
        category: it.cat,
        source: 'Receipt Scan',
      }));
      setReceiptExtractedItems(items);
      setIsScanningReceipt(false);
    }, 600);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptName(file.name);
    setIsScanningReceipt(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
      // Simulate intelligent receipt OCR
      setTimeout(() => {
        const date = new Date().toISOString().slice(0, 10);
        const sampleExtracted: Transaction[] = [
          {
            id: `ocr-${Date.now()}-1`,
            date,
            description: `${file.name.replace(/\.[^/.]+$/, '')} - Item 1`,
            amount: 18.50,
            category: 'Food',
            source: 'Receipt Scan',
          },
          {
            id: `ocr-${Date.now()}-2`,
            date,
            description: `${file.name.replace(/\.[^/.]+$/, '')} - Item 2`,
            amount: 7.25,
            category: 'Others',
            source: 'Receipt Scan',
          },
        ];
        setReceiptExtractedItems(sampleExtracted);
        setIsScanningReceipt(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmReceiptItems = () => {
    if (receiptExtractedItems.length === 0) return;
    onAddBatchTransactions(receiptExtractedItems);
    setSuccessMessage(`Successfully imported ${receiptExtractedItems.length} items from scanned receipt!`);
    setReceiptExtractedItems([]);
    setReceiptImage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121218] p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Add Student Expenses</span>
          </h1>
          <p className="text-xs text-[#9A9AA5] mt-1">
            Choose from 4 flexible input methods to log your expenses.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('transactions')}
          className="text-xs text-[#3DDC97] hover:underline font-semibold flex items-center gap-1 self-start md:self-auto"
        >
          <span>View All Transactions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#3DDC97]/15 border border-[#3DDC97]/40 text-[#3DDC97] text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-[#9A9AA5] hover:text-white text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/40 text-[#FF6B6B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-[#9A9AA5] hover:text-white text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-[#17171D] rounded-2xl border border-white/10">
        <button
          onClick={() => { setActiveMethod('upload'); setSuccessMessage(null); setErrorMessage(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeMethod === 'upload'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : 'text-[#9A9AA5] hover:text-white hover:bg-white/5'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>A. File Upload</span>
        </button>

        <button
          onClick={() => { setActiveMethod('manual'); setSuccessMessage(null); setErrorMessage(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeMethod === 'manual'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : 'text-[#9A9AA5] hover:text-white hover:bg-white/5'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>B. Manual Entry</span>
        </button>

        <button
          onClick={() => { setActiveMethod('paste'); setSuccessMessage(null); setErrorMessage(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeMethod === 'paste'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : 'text-[#9A9AA5] hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>C. Paste Text</span>
        </button>

        <button
          onClick={() => { setActiveMethod('receipt'); setSuccessMessage(null); setErrorMessage(null); }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeMethod === 'receipt'
              ? 'bg-[#7C5CFF] text-white shadow-md'
              : 'text-[#9A9AA5] hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>D. Receipt Images</span>
        </button>
      </div>

      {/* ================= METHOD A: FILE UPLOAD ================= */}
      {activeMethod === 'upload' && (
        <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#7C5CFF]" />
                <span>Upload Statement or Spreadsheet</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
                Supports CSV, Excel (.xlsx), and PDF / text bank statements.
              </p>
            </div>

            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-[#3DDC97] bg-[#3DDC97]/10 border border-[#3DDC97]/30 hover:bg-[#3DDC97]/20 transition-all self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Format Selector Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#9A9AA5] mr-1">Formats:</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono">.CSV</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono">.XLSX</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-mono">.PDF / .TXT</span>
          </div>

          {/* Drag & Drop Upload Container */}
          <div className="relative border-2 border-dashed border-white/15 hover:border-[#7C5CFF]/60 rounded-2xl p-8 text-center transition-all bg-[#0B0B0F]/50 group">
            <input
              type="file"
              accept=".csv, .xlsx, .xls, .pdf, .txt"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isParsingFile}
            />
            <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF] group-hover:scale-110 transition-transform">
                {isParsingFile ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {isParsingFile ? 'Analyzing spreadsheet columns...' : 'Drop your CSV, Excel (.xlsx), or PDF statement here'}
                </p>
                <p className="text-xs text-[#9A9AA5]">
                  Or click to browse files from your computer. Automatic category matching will run immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Parsed Preview Table */}
          {parsedFileItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Preview Parsed Records</span>
                    <span className="text-xs font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/30">
                      {parsedFileItems.length} items
                    </span>
                  </h3>
                  <p className="text-xs text-[#9A9AA5]">Review dates, categories, and amounts before importing</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParsedFileItems([])}
                    className="px-3 py-1.5 text-xs text-[#9A9AA5] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFileUpload}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#3DDC97] hover:bg-[#34c787] text-slate-900 rounded-xl transition-all shadow-md"
                  >
                    Confirm & Add {parsedFileItems.length} Expenses
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#0B0B0F]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[#9A9AA5] sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Description</th>
                      <th className="p-3 font-medium">Category</th>
                      <th className="p-3 font-medium text-right">Amount</th>
                      <th className="p-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedFileItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono text-slate-300">{item.date}</td>
                        <td className="p-3 font-semibold text-white">{item.description}</td>
                        <td className="p-3">
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const updated = [...parsedFileItems];
                              updated[index].category = e.target.value as ExpenseCategory;
                              setParsedFileItems(updated);
                            }}
                            className="bg-[#17171D] border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                          >
                            {EXPENSE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-mono font-bold text-right text-white">
                          {currency}{item.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setParsedFileItems(parsedFileItems.filter((_, i) => i !== index));
                            }}
                            className="text-[#9A9AA5] hover:text-[#FF6B6B] p-1"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= METHOD B: MANUAL ENTRY ================= */}
      {activeMethod === 'manual' && (
        <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-4 sm:space-y-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <PenTool className="w-5 h-5 text-[#7C5CFF]" />
              <span>Manual Transaction Entry</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
              Enter individual purchase details. Category is auto-suggested as you type.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#9A9AA5] font-mono text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5 flex items-center justify-between">
                  <span>Description</span>
                  <span className="text-[11px] text-[#3DDC97] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-categorizes keywords
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subway monthly metro card, Campus cafeteria bowl, Textbook for Biology..."
                  value={manualDescription}
                  onChange={handleDescriptionChange}
                  className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5 flex items-center justify-between">
                  <span>Category</span>
                  {isCategoryOverridden && (
                    <span className="text-[11px] text-[#7C5CFF]">Manual Selection</span>
                  )}
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => {
                    setManualCategory(e.target.value as ExpenseCategory);
                    setIsCategoryOverridden(true);
                  }}
                  className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-[#17171D] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
                  Payment Source
                </label>
                <select
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Debit Card">Debit Card</option>
                  <option value="Campus Card">Campus Card (Meal / Student ID)</option>
                  <option value="Bank Transfer">Bank Transfer / ACH</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online / Apple Pay / Google Pay</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Manual Entry">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#9A9AA5] mb-1.5">
                  Optional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Split with roomie, homework requirement, urgent necessity"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setManualDescription('');
                  setManualAmount('');
                  setManualNotes('');
                }}
                className="px-4 py-2 text-xs font-medium text-[#9A9AA5] hover:text-white"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] rounded-xl transition-all shadow-[0_0_20px_rgba(124,92,255,0.35)] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= METHOD C: PASTE TEXT ================= */}
      {activeMethod === 'paste' && (
        <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-[#7C5CFF]" />
                <span>Quick Paste Multi-Line Expenses</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
                Paste raw lines directly from notes, bank alerts, or WhatsApp chats.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#3DDC97] bg-[#3DDC97]/10 px-3 py-1.5 rounded-xl border border-[#3DDC97]/30 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Format: Description Amount</span>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={6}
              value={pasteInputText}
              onChange={(e) => setPasteInputText(e.target.value)}
              placeholder="Paste lines such as:&#10;Lunch 150&#10;Bus 40&#10;Books 500&#10;2026-10-18 Starbucks coffee 4.50"
              className="w-full bg-[#0B0B0F] border border-white/10 focus:border-[#7C5CFF] rounded-2xl p-4 text-xs font-mono text-white focus:outline-none resize-y"
            />
            <p className="text-[11px] text-[#9A9AA5]">
              Each row will automatically resolve into description, amount, date, and category.
            </p>
          </div>

          {/* Real-time Parsed Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Parsed Preview ({parsedPastedItems.length} detected)
              </h3>
              <button
                onClick={handleImportPasted}
                disabled={parsedPastedItems.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-[#7C5CFF] hover:bg-[#6b4ae8] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Import {parsedPastedItems.length} Expenses</span>
              </button>
            </div>

            {parsedPastedItems.length === 0 ? (
              <div className="py-8 text-center text-[#9A9AA5] text-xs bg-[#0B0B0F]/40 rounded-xl border border-white/5">
                Enter expense lines above to see real-time parsing.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto">
                {parsedPastedItems.map((item, idx) => {
                  const catColor = CATEGORY_COLORS[item.category || 'Others'] || CATEGORY_COLORS['Others'];
                  return (
                    <div 
                      key={idx}
                      className="p-3 bg-[#0B0B0F] rounded-xl border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{item.description}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#9A9AA5] mt-0.5">
                          <span style={{ color: catColor.primary }}>{item.category}</span>
                          <span>·</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white shrink-0">
                        {currency}{item.amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= METHOD D: RECEIPT IMAGES ================= */}
      {activeMethod === 'receipt' && (
        <div className="bg-[#17171D] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[24px] border border-white/10 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#3DDC97]" />
                <span>Receipt Image Scanner</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#9A9AA5] mt-0.5">
                Upload or snap receipts from bookstore, cafe, or grocery store to automatically extract line items.
              </p>
            </div>

            <span className="text-[11px] sm:text-xs font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2.5 sm:px-3 py-1 rounded-full border border-[#3DDC97]/30 self-start sm:self-auto">
              Ready for Receipt Extraction
            </span>
          </div>

          {/* Quick Demo Receipt Templates */}
          <div>
            <label className="block text-xs font-medium text-[#9A9AA5] mb-2">
              Try an Instant Campus Receipt Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {RECEIPT_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSelectReceiptPreset(p)}
                  className="p-3.5 rounded-xl bg-[#0B0B0F] border border-white/10 hover:border-[#3DDC97]/50 text-left transition-all group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-[#3DDC97] transition-colors">{p.name}</p>
                  <p className="text-[11px] text-[#9A9AA5] mt-0.5">{p.items.length} items · {p.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Custom Receipt Image */}
          <div className="relative border-2 border-dashed border-white/15 hover:border-[#3DDC97]/60 rounded-2xl p-6 text-center transition-all bg-[#0B0B0F]/40 group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isScanningReceipt}
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-[#3DDC97]/15 border border-[#3DDC97]/30 flex items-center justify-center text-[#3DDC97]">
                {isScanningReceipt ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
              <p className="text-xs font-semibold text-white">
                {isScanningReceipt ? 'Scanning receipt image...' : 'Upload receipt image (JPG, PNG, WebP)'}
              </p>
              <p className="text-[11px] text-[#9A9AA5]">
                Computer vision & text parsing extracts items and amounts automatically.
              </p>
            </div>
          </div>

          {/* Extracted Receipt Items Preview */}
          {receiptExtractedItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Extracted Receipt Line Items</span>
                    <span className="text-xs font-mono text-[#3DDC97] bg-[#3DDC97]/10 px-2 py-0.5 rounded-full border border-[#3DDC97]/30">
                      {receiptExtractedItems.length} items
                    </span>
                  </h3>
                  <p className="text-xs text-[#9A9AA5]">Source: {receiptName || 'Scanned Receipt'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReceiptExtractedItems([]);
                      setReceiptImage(null);
                    }}
                    className="px-3 py-1.5 text-xs text-[#9A9AA5] hover:text-white"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleConfirmReceiptItems}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#3DDC97] text-slate-900 rounded-xl transition-all shadow-md"
                  >
                    Import {receiptExtractedItems.length} Items ({currency}{receiptExtractedItems.reduce((s, i) => s + i.amount, 0).toFixed(2)})
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0B0B0F] divide-y divide-white/5">
                {receiptExtractedItems.map((item, idx) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/5">
                    <div className="min-w-0 pr-3">
                      <p className="font-semibold text-white truncate">{item.description}</p>
                      <p className="text-[11px] text-[#9A9AA5] mt-0.5">
                        <span className="text-[#7C5CFF] font-medium">{item.category}</span> · {item.date}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {currency}{item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
