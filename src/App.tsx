/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Info, 
  SlidersHorizontal,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpDown,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Archive,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STOCK_PRESETS } from './presets';
import { Holding } from './types';

const DEFAULT_HOLDINGS: Holding[] = [
  { id: '1', symbol: 'AAPL', quantity: 15, price: 185.50, isCustom: false },
  { id: '2', symbol: 'NVDA', quantity: 45, price: 128.40, isCustom: false },
  { id: '3', symbol: 'MSFT', quantity: 8, price: 415.80, isCustom: false },
  { id: '4', symbol: 'TSLA', quantity: 12, price: 245.20, isCustom: false },
  { id: '5', symbol: 'NFLX', quantity: 5, price: 610.20, isCustom: false }
];

export default function App() {
  // Local storage backup and state management
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('portfolio_holdings_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load saved holdings, reverting to default.", e);
      }
    }
    return DEFAULT_HOLDINGS;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('portfolio_holdings_v1', JSON.stringify(holdings));
  }, [holdings]);

  // Form State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('10');
  
  // UI States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'value' | 'symbol' | 'quantity' | 'price'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Auto-dismiss alert after 4 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Trigger preset stock change & auto-populate corresponding price/symbol
  const handlePresetSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    if (symbol !== 'CUSTOM') {
      setCustomSymbol('');
      setCustomPrice('');
    } else {
      setCustomPrice('100.00');
    }
  };

  // Helper to trigger automated alerts
  const showAlert = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setAlertMessage({ text, type });
  };

  // Calculated Portfolio Metrics
  const { totalValue, totalShares, uniqueAssets, topHolding, portfolioWithStats } = useMemo(() => {
    let sumValue = 0;
    let sumShares = 0;
    let topVal = 0;
    let topH: Holding | null = null;

    const list = holdings.map(h => {
      const currentPrice = h.price;
      const val = h.quantity * currentPrice;
      sumValue += val;
      sumShares += h.quantity;

      if (val > topVal) {
        topVal = val;
        topH = h;
      }

      return {
        ...h,
        totalHoldingsValue: val,
      };
    });

    // Add weights metric
    const withWeights = list.map(item => {
      const weight = sumValue > 0 ? (item.totalHoldingsValue / sumValue) * 100 : 0;
      return {
        ...item,
        weight,
      };
    });

    return {
      totalValue: sumValue,
      totalShares: sumShares,
      uniqueAssets: holdings.length,
      topHolding: topH as Holding | null,
      portfolioWithStats: withWeights,
    };
  }, [holdings]);

  // Filtering & Sorting List of Holdings
  const sortedHoldings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // Filter
    let result = portfolioWithStats.filter(item => {
      const symbolMatch = item.symbol.toLowerCase().includes(query);
      const presetInfo = STOCK_PRESETS[item.symbol.toUpperCase()];
      const nameMatch = presetInfo ? presetInfo.name.toLowerCase().includes(query) : false;
      return symbolMatch || nameMatch;
    });

    // Sort
    result.sort((a, b) => {
      let multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (sortBy === 'symbol') {
        return multiplier * a.symbol.localeCompare(b.symbol);
      }
      if (sortBy === 'price') {
        return multiplier * (a.price - b.price);
      }
      if (sortBy === 'quantity') {
        return multiplier * (a.quantity - b.quantity);
      }
      // default sortBy === 'value'
      return multiplier * (a.totalHoldingsValue - b.totalHoldingsValue);
    });

    return result;
  }, [portfolioWithStats, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: 'value' | 'symbol' | 'quantity' | 'price') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Add Item to holdings
  const handleAddStock = (e: FormEvent) => {
    e.preventDefault();

    const isPreset = selectedSymbol !== 'CUSTOM';
    const symbolToUse = (isPreset ? selectedSymbol : customSymbol).trim().toUpperCase();
    const qtyNum = parseFloat(quantity);
    
    // Validations
    if (!symbolToUse) {
      showAlert('Please enter a valid stock symbol.', 'error');
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      showAlert('Share quantity must be a positive number.', 'error');
      return;
    }

    let resolvedPrice = 0;
    if (isPreset) {
      const preset = STOCK_PRESETS[selectedSymbol];
      if (preset) {
        resolvedPrice = preset.price;
      } else {
        showAlert('Preset price not found.', 'error');
        return;
      }
    } else {
      const prcNum = parseFloat(customPrice);
      if (isNaN(prcNum) || prcNum <= 0) {
        showAlert('Custom stock price must be a positive number.', 'error');
        return;
      }
      resolvedPrice = prcNum;
    }

    // Check if stock already exists in holdings
    const existingIndex = holdings.findIndex(h => h.symbol === symbolToUse);
    
    if (existingIndex >= 0) {
      // Prompt user option / Automatically merge quantities!
      const updated = [...holdings];
      const prevQty = updated[existingIndex].quantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: prevQty + qtyNum,
        price: resolvedPrice, // update to current price
        isCustom: !isPreset
      };
      setHoldings(updated);
      showAlert(`Added ${qtyNum} shares to existing ${symbolToUse} holding (New quantity: ${prevQty + qtyNum}).`, 'success');
    } else {
      const newHolding: Holding = {
        id: Date.now().toString(),
        symbol: symbolToUse,
        quantity: qtyNum,
        price: resolvedPrice,
        isCustom: !isPreset
      };
      setHoldings(prev => [newHolding, ...prev]);
      showAlert(`Successfully introduced ${qtyNum} shares of ${symbolToUse} to your portfolio!`, 'success');
    }

    // Reset inputs
    setQuantity('10');
    if (!isPreset) {
      setCustomSymbol('');
      setCustomPrice('');
    }
  };

  // Remove individual stock
  const handleDeleteHolding = (id: string, symbol: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
    showAlert(`${symbol} removed from portfolio successfully.`, 'info');
    if (editingId === id) setEditingId(null);
  };

  // Adjust shares inline (+/- buttons)
  const adjustShares = (id: string, amount: number) => {
    setHoldings(prev => {
      return prev.map(h => {
        if (h.id === id) {
          const newQty = Math.max(0, h.quantity + amount);
          return { ...h, quantity: newQty };
        }
        return h;
      }).filter(h => h.quantity > 0); // remove if drops to 0
    });
    showAlert(`Adjusted stock allocation.`, 'success');
  };

  // Trigger inline row edit mode
  const startEditing = (h: Holding) => {
    setEditingId(h.id);
    setEditingQuantity(h.quantity.toString());
    setEditingPrice(h.price.toString());
  };

  // Save inline edits
  const saveInlineEdit = (id: string) => {
    const qtyVal = parseFloat(editingQuantity);
    const prcVal = parseFloat(editingPrice);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      showAlert('Quantity must be a positive number.', 'error');
      return;
    }

    if (isNaN(prcVal) || prcVal <= 0) {
      showAlert('Price must be a positive number.', 'error');
      return;
    }

    setHoldings(prev => {
      return prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            quantity: qtyVal,
            price: prcVal
          };
        }
        return h;
      });
    });

    setEditingId(null);
    showAlert('Investment parameters updated.', 'success');
  };

  // Reset to default sample holdings
  const handleLoadSample = () => {
    setHoldings(DEFAULT_HOLDINGS);
    showAlert('Loaded sample pre-configured assets successfully.', 'info');
  };

  // Clear all holdings
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all entries in your portfolio tracker?')) {
      setHoldings([]);
      showAlert('Portfolio cleared. Ready for fresh imports!', 'info');
    }
  };

  // Client-Side CSV Exporter
  const exportCSV = () => {
    if (holdings.length === 0) {
      showAlert('No assets available to export.', 'error');
      return;
    }

    const headers = "Symbol,Company Name,Asset Price ($),Quantity Selected,Total Market Value ($),Portfolio Allocation (%)\n";
    const rows = portfolioWithStats.map(h => {
      const presetInfo = STOCK_PRESETS[h.symbol];
      const name = presetInfo ? presetInfo.name : "Custom Holding";
      return `"${h.symbol}","${name}",${h.price.toFixed(2)},${h.quantity},${h.totalHoldingsValue.toFixed(2)},${h.weight.toFixed(1)}%`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.id = "csv-downloader";
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Successfully downloaded CSV log.', 'success');
  };

  // Client-Side TXT Reporter
  const exportTXT = () => {
    if (holdings.length === 0) {
      showAlert('No assets available to export.', 'error');
      return;
    }

    const dateStr = new Date().toLocaleString();
    let content = `===========================================================\n`;
    content += `             PERSONAL PORTFOLIO PERFORMANCE REPORT\n`;
    content += `             Created On: ${dateStr}\n`;
    content += `===========================================================\n\n`;
    content += `PORTFOLIO AGGREGATE SUMMARY:\n`;
    content += `-----------------------------------------------------------\n`;
    content += `• Total Portfolio Investment: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    content += `• Number of Assets Traded: ${uniqueAssets}\n`;
    content += `• Aggregated Share Volume: ${totalShares.toFixed(2)} units\n`;
    if (topHolding) {
      const topPreset = STOCK_PRESETS[topHolding.symbol];
      const topName = topPreset ? topPreset.name : "Custom Asset";
      content += `• Primary Asset Weight (Top): ${topHolding.symbol} (${topName}) - Value: $${(topHolding.price * topHolding.quantity).toFixed(2)}\n`;
    }
    content += `\n`;
    content += `HOLDINGS BREAKDOWN OVERVIEW:\n`;
    content += `---------------------------------------------------------------------------------------------------------\n`;
    content += `Symbol     | Company Name            | Price ($) | Quantity    | Value ($)            | Allocation (%)\n`;
    content += `---------------------------------------------------------------------------------------------------------\n`;
    
    portfolioWithStats.forEach(h => {
      const presetInfo = STOCK_PRESETS[h.symbol];
      const name = presetInfo ? presetInfo.name : "Custom Holding";
      
      const symbolField = h.symbol.padEnd(10);
      const nameField = name.substring(0, 22).padEnd(23);
      const priceField = `$${h.price.toFixed(2)}`.padEnd(9);
      const qtyField = h.quantity.toString().padEnd(11);
      const valueField = `$${h.totalHoldingsValue.toFixed(2)}`.padEnd(20);
      const weightField = `${h.weight.toFixed(1)}%`;
      
      content += `${symbolField} | ${nameField} | ${priceField} | ${qtyField} | ${valueField} | ${weightField}\n`;
    });
    
    content += `---------------------------------------------------------------------------------------------------------\n`;
    content += `Generated via Stock Portfolio Tracker. Secure offline file.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.id = "txt-downloader";
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_portfolio_summary_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Successfully downloaded text summary statement.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#1E1E24] font-sans transition-colors duration-150">
      
      {/* Header Container */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#EAEAEF]">
        <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-zinc-900 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-5 flex-shrink-0 h-5" id="header-logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-zinc-900">Portfolio Tracker</h1>
              <p className="text-xs text-zinc-500 font-mono hidden sm:block">Dictionary-driven Valuation Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              id="btn-load-sample"
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-all flex items-center gap-1.5 border border-zinc-200/60"
              title="Reset configuration to standard tech holding dictionary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Load Presets</span>
            </button>
            <button 
              id="btn-clear-all"
              onClick={handleClearAll}
              disabled={holdings.length === 0}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all flex items-center gap-1.5 border border-rose-200/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Portfolio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Floating Notification Indicator */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              id="alert-toast-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl shadow-md border mb-6 flex items-start gap-3 justify-between ${
                alertMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : alertMessage.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <div className="flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold">System Message</h4>
                  <p className="text-xs opacity-90 mt-0.5">{alertMessage.text}</p>
                </div>
              </div>
              <button 
                id="btn-alert-dismiss"
                onClick={() => setAlertMessage(null)}
                className="hover:opacity-70 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Key Stats Cards Grid */}
        <section id="portfolio-stats-aggregate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          
          {/* Card 1: Total Valuation */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Portfolio Value</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 flex-shrink-0 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-display text-zinc-950">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-zinc-400">USD</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              Total manually recorded capital
            </p>
          </div>

          {/* Card 2: Share Allocations */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Volume Traded</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-4 flex-shrink-0 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-display text-zinc-950">
                {totalShares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-zinc-400">shares</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              Summed volume across all positions
            </p>
          </div>

          {/* Card 3: Asset Diversity */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Unique Tickers</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Archive className="w-4 flex-shrink-0 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-display text-zinc-950">
                {uniqueAssets}
              </span>
              <span className="text-xs font-semibold text-zinc-400">symbols</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              Assets loaded in memory
            </p>
          </div>

          {/* Card 4: Top Holding Weight */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3 text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Top Allocation</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <ArrowUpRight className="w-4 flex-shrink-0 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-display text-zinc-950">
                {topHolding ? topHolding.symbol : 'None'}
              </span>
              {topHolding && (
                <span className="text-xs font-semibold text-zinc-400 ml-1">
                  ({(((topHolding.price * topHolding.quantity) / (totalValue || 1)) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              Position with heaviest balance weight
            </p>
          </div>
        </section>

        {/* Lower Main Two-Column Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Span 4): Input Controls Panel */}
          <section id="asset-addition-panel" className="lg:col-span-4 space-y-6">
            
            {/* Form Container */}
            <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
                <h2 className="text-base font-bold font-display text-zinc-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-zinc-600" />
                  <span>Modify Stock Holding</span>
                </h2>
                <span className="text-[10px] font-mono tracking-wider font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 uppercase">Input Node</span>
              </div>

              {/* Quick Fill List: Visual feedback of dictionary assets */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono mb-2">
                  Quick-Fill Preset Stocks
                </label>
                <div id="quick-preset-picker-grid" className="grid grid-cols-4 gap-2">
                  {Object.values(STOCK_PRESETS).slice(0, 8).map(p => (
                    <button
                      key={p.symbol}
                      type="button"
                      onClick={() => handlePresetSelect(p.symbol)}
                      className={`text-[11px] font-semibold py-1.5 px-1 text-center rounded-lg border transition-all cursor-pointer ${
                        selectedSymbol === p.symbol 
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' 
                          : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200/70'
                      }`}
                    >
                      <div className="font-bold">{p.symbol}</div>
                      <div className="text-[9px] opacity-70">${p.price.toFixed(0)}</div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('CUSTOM')}
                    className={`col-span-4 text-[11px] font-semibold py-1.5 px-2 text-center rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedSymbol === 'CUSTOM'
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span>✦ Add Custom Ticker / Custom Price</span>
                  </button>
                </div>
              </div>

              {/* Form implementation */}
              <form onSubmit={handleAddStock} className="space-y-4">
                
                {/* Symbol selector wrapper */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
                    Asset Ticker Symbol
                  </label>
                  
                  {selectedSymbol !== 'CUSTOM' ? (
                    <div className="relative">
                      <select
                        id="select-stock-symbol"
                        value={selectedSymbol}
                        onChange={(e) => handlePresetSelect(e.target.value)}
                        className="w-full bg-[#F4F4F6] text-sm text-zinc-800 py-2.5 px-3 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 outline-none transition-all cursor-pointer font-bold appearance-none"
                      >
                        {Object.values(STOCK_PRESETS).map(item => (
                          <option key={item.symbol} value={item.symbol}>
                            {item.symbol} — {item.name} (${item.price.toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <input
                          id="input-custom-symbol"
                          type="text"
                          required
                          placeholder="e.g. BTC, HOOD, ORCL"
                          value={customSymbol}
                          onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                          className="w-full bg-white text-sm text-zinc-800 font-mono font-bold py-2.5 px-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                        />
                        <p className="text-[10px] text-amber-700 mt-1">
                          You are creating a custom ticker symbol not found in our pre-defined dictionary.
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
                          Assigned Custom Share Price ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 inset-y-0 flex items-center text-zinc-400 font-mono text-sm">$</span>
                          <input
                            id="input-custom-price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="Price"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="w-full bg-white text-sm text-zinc-800 font-mono pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">
                    Share Quantity
                  </label>
                  <input
                    id="input-stock-quantity"
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    placeholder="e.g., 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-white text-sm text-zinc-800 font-mono py-2.5 px-3 rounded-xl border border-[#DCDCE2] focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Supports fractional quantities (e.g. 2.5 shares).</p>
                </div>

                {/* Estimated Cost Preview */}
                {(() => {
                  const isPreset = selectedSymbol !== 'CUSTOM';
                  const numericQuantity = parseFloat(quantity) || 0;
                  let pricePreview = 0;
                  if (isPreset) {
                    pricePreview = STOCK_PRESETS[selectedSymbol]?.price || 0;
                  } else {
                    pricePreview = parseFloat(customPrice) || 0;
                  }
                  const estimated = numericQuantity * pricePreview;

                  return (
                    <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/50 flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-500">Estimated Value</span>
                      <span className="font-mono font-bold text-zinc-950 bg-white px-2 py-1 rounded shadow-xs border border-zinc-100">
                        ${estimated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })()}

                {/* Submit Action Button */}
                <button
                  id="btn-submit-stock-form"
                  type="submit"
                  className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl tracking-wide transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Update & Append Portfolio</span>
                </button>
              </form>
            </div>

            {/* Quick Pricing Table Dictionary reference */}
            <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono mb-3">
                Dictionary Valuation Registry ({Object.keys(STOCK_PRESETS).length} stocks)
              </h3>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Prices are set by hardcoded variables in our core registry. Matching input ticker codes guarantees immediate valuation sync.
              </p>
              
              <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2" id="valuation-dictionary-panel">
                {Object.values(STOCK_PRESETS).map(item => (
                  <div 
                    key={item.symbol} 
                    onClick={() => handlePresetSelect(item.symbol)}
                    className="group flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-zinc-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded group-hover:bg-zinc-200 transition-all">
                        {item.symbol}
                      </span>
                      <span className="text-xs text-zinc-500 truncate max-w-28">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#1E1E24]">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
          </section>

          {/* Right Column (Span 8): Holdings List and Metrics Breakdown */}
          <section id="assets-breakdown-panel" className="lg:col-span-8 space-y-6">
            
            {/* Visual Portfolio Distribution Breakdown */}
            <div className="bg-white rounded-2xl border border-zinc-200/70 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                <h3 className="text-sm font-bold font-display text-zinc-950 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-zinc-500" />
                  <span>Allocation Distribution Weight</span>
                </h3>
                <span className="text-xs text-zinc-500 font-mono">Normalized Percentages</span>
              </div>

              {holdings.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  Provide holdings below to generate automatic asset breakdowns.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Multi-segmented full-width horizontal bar chart */}
                  <div className="h-6 w-full bg-zinc-100 rounded-full overflow-hidden flex shadow-inner">
                    {portfolioWithStats.map((item, index) => {
                      const colors = [
                        'bg-zinc-900', 'bg-blue-600', 'bg-emerald-500', 
                        'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 
                        'bg-teal-500', 'bg-purple-500', 'bg-orange-500'
                      ];
                      const segmentColor = colors[index % colors.length];
                      
                      if (item.weight <= 0) return null;

                      return (
                        <div
                          key={item.id}
                          className={`${segmentColor} h-full transition-all duration-300 relative group`}
                          style={{ width: `${item.weight}%` }}
                          title={`${item.symbol}: ${item.weight.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Segment Legend Indicator Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                    {portfolioWithStats.map((item, index) => {
                      const colors = [
                        'bg-zinc-900', 'bg-blue-600', 'bg-emerald-500', 
                        'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 
                        'bg-teal-500', 'bg-purple-500', 'bg-orange-500'
                      ];
                      const segmentColor = colors[index % colors.length];

                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${segmentColor} flex-shrink-0`} />
                          <span className="text-xs font-mono font-bold text-zinc-800">{item.symbol}</span>
                          <span className="text-[11px] text-zinc-400 font-mono ml-auto">
                            {item.weight.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Main Holdings Interactive Table Grid */}
            <div className="bg-white rounded-2xl border border-zinc-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
              
              {/* Table search, sorting controls, and Actions Header */}
              <div className="p-5 border-b border-zinc-100 bg-[#FCFCFE] flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                <div className="w-full sm:w-auto flex-1 relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-holding-search"
                    type="text"
                    placeholder="Search holdings by symbol or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:max-w-xs bg-white text-xs text-zinc-800 pl-9 pr-3 py-2 rounded-xl border border-zinc-200/90 outline-none focus:ring-2 focus:ring-zinc-950 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
                  
                  {/* File Exporter Dropdowns */}
                  <button
                    id="btn-export-txt"
                    onClick={exportTXT}
                    className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Report (.TXT)</span>
                  </button>

                  <button
                    id="btn-export-csv"
                    onClick={exportCSV}
                    className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sheet (.CSV)</span>
                  </button>
                </div>
              </div>

              {/* Table rendering panel */}
              <div className="overflow-x-auto">
                <table id="holdings-valuation-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-zinc-400 text-[10px] uppercase tracking-wider font-mono bg-zinc-50/50">
                      <th className="py-3 px-5 font-bold cursor-pointer hover:bg-zinc-100 transition" onClick={() => handleSort('symbol')}>
                        <div className="flex items-center gap-1">
                          <span>Asset Ticker</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:bg-[#F2F2F5] transition" onClick={() => handleSort('price')}>
                        <div className="flex items-center gap-1">
                          <span>Price</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:bg-[#F2F2F5] transition" onClick={() => handleSort('quantity')}>
                        <div className="flex items-center gap-1">
                          <span>Shares Held</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold cursor-pointer hover:bg-[#F2F2F5] transition" onClick={() => handleSort('value')}>
                        <div className="flex items-center gap-1">
                          <span>Market Valuation</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-zinc-100/75 text-sm">
                    <AnimatePresence initial={false}>
                      {sortedHoldings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-zinc-400 text-xs">
                            {searchQuery ? 'No matching assets found in your search.' : 'Your active stock portfolio is empty. Add a ticker on the left!'}
                          </td>
                        </tr>
                      ) : (
                        sortedHoldings.map((h) => {
                          const preset = STOCK_PRESETS[h.symbol];
                          const name = preset ? preset.name : 'Custom Stock';
                          const dynamicColor = preset ? preset.color : 'bg-amber-50 text-amber-900 border-amber-200';
                          const isCurrentlyEditing = editingId === h.id;

                          return (
                            <motion.tr
                              key={h.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              layout
                              className={`group hover:bg-[#FAF9FB] transition-all ${isCurrentlyEditing ? 'bg-indigo-50/20' : ''}`}
                            >
                              {/* Symbol and Company column */}
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center font-bold font-mono text-xs ${dynamicColor}`}>
                                    {h.symbol}
                                  </div>
                                  <div>
                                    <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                                      <span>{h.symbol}</span>
                                      {h.isCustom && (
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                          CUSTOM
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-zinc-400 group-hover:text-zinc-500 transition truncate max-w-44">
                                      {name}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Price column (Editable) */}
                              <td className="py-4 px-4">
                                {isCurrentlyEditing ? (
                                  <div className="relative max-w-28">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      value={editingPrice}
                                      onChange={(e) => setEditingPrice(e.target.value)}
                                      className="bg-white border border-zinc-300 font-mono text-xs pl-6 pr-1.5 py-1.5 rounded-lg w-full focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                                    />
                                  </div>
                                ) : (
                                  <span className="font-mono font-semibold text-zinc-800">
                                    ${h.price.toFixed(2)}
                                  </span>
                                )}
                              </td>

                              {/* Quantity column (Editable) */}
                              <td className="py-4 px-4">
                                {isCurrentlyEditing ? (
                                  <input
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    value={editingQuantity}
                                    onChange={(e) => setEditingQuantity(e.target.value)}
                                    className="bg-white border border-zinc-300 font-mono text-xs p-1.5 rounded-lg max-w-24 focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-zinc-800">
                                      {h.quantity}
                                    </span>
                                    
                                    {/* Small micro adjustments helper */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white">
                                      <button 
                                        onClick={() => adjustShares(h.id, -1)}
                                        className="px-2 py-0.5 hover:bg-zinc-100 text-xs font-mono font-bold text-zinc-600 border-r border-zinc-200"
                                        title="Reduce by 1 share"
                                      >
                                        -
                                      </button>
                                      <button 
                                        onClick={() => adjustShares(h.id, 1)}
                                        className="px-2 py-0.5 hover:bg-zinc-100 text-xs font-mono font-bold text-zinc-600"
                                        title="Increase by 1 share"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Market Value & Allocation weight column */}
                              <td className="py-4 px-4">
                                <div>
                                  <div className="font-mono font-bold text-zinc-950">
                                    ${h.totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 font-mono">
                                    Allocation: {h.weight.toFixed(1)}%
                                  </div>
                                </div>
                              </td>

                              {/* Action Row controller */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isCurrentlyEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveInlineEdit(h.id)}
                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                        title="Save edits"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition"
                                        title="Discard changes"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEditing(h)}
                                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Edit parameters inline"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteHolding(h.id, h.symbol)}
                                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete position"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Grid Footer details */}
              {holdings.length > 0 && (
                <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span>Showing {sortedHoldings.length} of {uniqueAssets} assets</span>
                  <span>Currency stated in USD</span>
                </div>
              )}
            </div>

            {/* Quick Helper Tips Panel */}
            <div className="bg-zinc-900 text-zinc-400 rounded-2xl p-6 border border-zinc-800">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <span>How Dictionary Pricing Operates</span>
              </h4>
              <ul className="text-xs space-y-2 leading-relaxed list-disc list-inside">
                <li>Adding shares of <span className="text-white font-semibold">AAPL</span> or other presets will use the hardcoded rates: <span className="text-[#3b82f6] font-mono">AAPL = $185.50</span>, <span className="text-[#f43f5e] font-mono">NFLX = $610.20</span>.</li>
                <li>Enter custom share tickers by toggling "✦ Add Custom Ticker" to define your own symbols and custom purchase prices.</li>
                <li>Download your updated stats anytime by clicking the <span className="text-white">Report (.TXT)</span> or <span className="text-white">Sheet (.CSV)</span> buttons to save live files.</li>
              </ul>
            </div>

          </section>

        </div>
      </main>

      {/* Footer Block */}
      <footer className="bg-white border-t border-[#EAEAEF] mt-20 py-8 text-xs text-zinc-400 text-center font-mono">
        <p>© 2026 Stock Portfolio Tracker. Secure client-side sandbox execution.</p>
      </footer>

    </div>
  );
}
