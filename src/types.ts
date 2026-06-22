export interface StockPreset {
  symbol: string;
  name: string;
  price: number;
  color: string; // Tailwind color class for badge/icon background
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  price: number; // resolved price (either preset or custom)
  isCustom: boolean;
}
