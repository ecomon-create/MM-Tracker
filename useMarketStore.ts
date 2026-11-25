import { create } from 'zustand';

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface Trade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface Wall {
  price: number;
  quantity: number;
  side: 'bid' | 'ask';
  strength: number; // ratio to average
  status: 'growing' | 'stable' | 'declining';
  previousQuantity: number;
}

export interface ImpulseCandle {
  time: number;
  buyVolume: number;
  sellVolume: number;
  totalTrades: number;
  delta: number;
}

export interface Signal {
  id: string;
  time: number;
  type: 'breakout_up' | 'breakout_down' | 'bounce_up' | 'bounce_down' | 'impulse_buy' | 'impulse_sell' | 'wall_removed' | 'wall_placed';
  price: number;
  message: string;
  strength: 'low' | 'medium' | 'high';
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketState {
  symbol: string;
  setSymbol: (s: string) => void;
  
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  setBids: (b: OrderBookLevel[]) => void;
  setAsks: (a: OrderBookLevel[]) => void;
  
  trades: Trade[];
  addTrades: (t: Trade[]) => void;
  
  walls: Wall[];
  setWalls: (w: Wall[]) => void;
  
  impulseCandles: ImpulseCandle[];
  addImpulseCandle: (c: ImpulseCandle) => void;
  
  signals: Signal[];
  addSignal: (s: Signal) => void;
  clearSignals: () => void;
  
  klines: KlineData[];
  setKlines: (k: KlineData[]) => void;
  addKline: (k: KlineData) => void;
  
  currentPrice: number;
  setCurrentPrice: (p: number) => void;
  
  isConnected: boolean;
  setConnected: (c: boolean) => void;
  
  wallThreshold: number;
  setWallThreshold: (t: number) => void;
  
  impulseWindow: number;
  setImpulseWindow: (w: number) => void;
  
  soundEnabled: boolean;
  setSoundEnabled: (s: boolean) => void;
  
  depthLevels: number;
  setDepthLevels: (d: number) => void;
  
  minWallUsd: number;
  setMinWallUsd: (v: number) => void;
  
  signalCooldown: number;
  setSignalCooldown: (v: number) => void;
  
  impulseTF: number;       // Таймфрейм импульсных свечей (минуты)
  setImpulseTF: (v: number) => void;
  
  priceStep: number;       // Шаг группировки цены в стакане
  setPriceStep: (v: number) => void;
  
  chartTF: string;         // Таймфрейм графика ('1m','5m','15m','1h','4h','1d')
  setChartTF: (v: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: 'BTCUSDT',
  setSymbol: (symbol) => set({ symbol, trades: [], signals: [], walls: [], impulseCandles: [], klines: [] }),
  
  bids: [],
  asks: [],
  setBids: (bids) => set({ bids }),
  setAsks: (asks) => set({ asks }),
  
  trades: [],
  addTrades: (newTrades) => set((state) => ({
    trades: [...state.trades, ...newTrades].slice(-2000)
  })),
  
  walls: [],
  setWalls: (walls) => set({ walls }),
  
  impulseCandles: [],
  addImpulseCandle: (candle) => set((state) => ({
    impulseCandles: [...state.impulseCandles, candle].slice(-200)
  })),
  
  signals: [],
  addSignal: (signal) => set((state) => ({
    signals: [signal, ...state.signals].slice(0, 50)
  })),
  clearSignals: () => set({ signals: [] }),
  
  klines: [],
  setKlines: (klines) => set({ klines }),
  addKline: (kline) => set((state) => {
    const existing = [...state.klines];
    const lastIdx = existing.findIndex(k => k.time === kline.time);
    if (lastIdx >= 0) {
      existing[lastIdx] = kline;
    } else {
      existing.push(kline);
    }
    return { klines: existing.slice(-500) };
  }),
  
  currentPrice: 0,
  setCurrentPrice: (currentPrice) => set({ currentPrice }),
  
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),
  
  wallThreshold: 3,
  setWallThreshold: (wallThreshold) => set({ wallThreshold }),
  
  impulseWindow: 5,
  setImpulseWindow: (impulseWindow) => set({ impulseWindow }),
  
  soundEnabled: true,
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  
  depthLevels: 20,
  setDepthLevels: (depthLevels) => set({ depthLevels }),
  
  minWallUsd: 100000,
  setMinWallUsd: (minWallUsd) => set({ minWallUsd }),
  
  signalCooldown: 30,
  setSignalCooldown: (signalCooldown) => set({ signalCooldown }),
  
  impulseTF: 5,
  setImpulseTF: (impulseTF) => set({ impulseTF, impulseCandles: [] }),
  
  priceStep: 100,
  setPriceStep: (priceStep) => set({ priceStep }),
  
  chartTF: '15m',
  setChartTF: (chartTF) => set({ chartTF, klines: [] }),
}));
