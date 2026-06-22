import { StockPreset } from './types';

export const STOCK_PRESETS: Record<string, StockPreset> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, color: 'bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100' },
  TSLA: { symbol: 'TSLA', name: 'Tesla, Inc.', price: 245.20, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 128.40, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 178.60, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400' },
  GOOG: { symbol: 'GOOG', name: 'Alphabet Inc.', price: 172.30, color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400' },
  META: { symbol: 'META', name: 'Meta Platforms', price: 495.10, color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400' },
  NFLX: { symbol: 'NFLX', name: 'Netflix, Inc.', price: 610.20, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400' },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', price: 158.90, color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400' },
  COIN: { symbol: 'COIN', name: 'Coinbase Global', price: 222.40, color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400' },
  DIS: { symbol: 'DIS', name: 'The Walt Disney Co.', price: 112.10, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400' },
  NKE: { symbol: 'NKE', name: 'Nike, Inc.', price: 95.80, color: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/30 dark:text-lime-400' }
};
