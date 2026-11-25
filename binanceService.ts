import { useMarketStore, type OrderBookLevel, type Trade, type KlineData } from '../store/useMarketStore';

let depthWs: WebSocket | null = null;
let tradeWs: WebSocket | null = null;
let klineWs: WebSocket | null = null;

/**
 * Подключение всех WebSocket потоков.
 * Вызывается при старте анализа и при смене символа.
 */
export function connectWebSockets(symbol: string) {
  disconnectWebSockets();
  
  const sym = symbol.toLowerCase();
  const chartTF = useMarketStore.getState().chartTF;
  
  // REST: историческийе свечи + снапшот стакана
  fetchKlines(symbol, chartTF);
  fetchDepthSnapshot(symbol);
  
  // 1. Стакан ордеров
  depthWs = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`);
  
  depthWs.onopen = () => {
    useMarketStore.getState().setConnected(true);
  };
  
  depthWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const bids: OrderBookLevel[] = data.bids.map((b: string[]) => ({
        price: parseFloat(b[0]),
        quantity: parseFloat(b[1])
      }));
      const asks: OrderBookLevel[] = data.asks.map((a: string[]) => ({
        price: parseFloat(a[0]),
        quantity: parseFloat(a[1])
      }));
      useMarketStore.getState().setBids(bids);
      useMarketStore.getState().setAsks(asks);
    } catch (e) {
      console.error('Depth parse error:', e);
    }
  };
  
  depthWs.onclose = () => { useMarketStore.getState().setConnected(false); };
  depthWs.onerror = () => { useMarketStore.getState().setConnected(false); };
  
  // 2. Поток сделок (для дельты и ленты)
  tradeWs = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@trade`);
  
  tradeWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const trade: Trade = {
        id: data.t,
        price: parseFloat(data.p),
        quantity: parseFloat(data.q),
        time: data.T,
        isBuyerMaker: data.m
      };
      useMarketStore.getState().setCurrentPrice(trade.price);
      useMarketStore.getState().addTrades([trade]);
    } catch (e) {
      console.error('Trade parse error:', e);
    }
  };
  
  // 3. Поток свечей — по выбранному TF
  connectKlineStream(sym, chartTF);
}

/**
 * Переключение ТОЛЬКО потока свечей (без разрыва стакана и сделок).
 * Вызывается при смене TF на графике.
 */
export function switchChartTF(newTF: string) {
  const state = useMarketStore.getState();
  const sym = state.symbol.toLowerCase();
  
  // Закрываем только kline поток
  if (klineWs) { klineWs.close(); klineWs = null; }
  
  // Очищаем старые свечи и загружаем новые
  state.setKlines([]);
  fetchKlines(state.symbol, newTF);
  connectKlineStream(sym, newTF);
}

function connectKlineStream(sym: string, tf: string) {
  // Binance kline intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
  klineWs = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@kline_${tf}`);
  
  klineWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const k = data.k;
      const kline: KlineData = {
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v)
      };
      useMarketStore.getState().addKline(kline);
    } catch (e) {
      console.error('Kline parse error:', e);
    }
  };
}

export function disconnectWebSockets() {
  if (depthWs) { depthWs.close(); depthWs = null; }
  if (tradeWs) { tradeWs.close(); tradeWs = null; }
  if (klineWs) { klineWs.close(); klineWs = null; }
  useMarketStore.getState().setConnected(false);
}

async function fetchKlines(symbol: string, interval: string) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=300`
    );
    const data = await res.json();
    const klines: KlineData[] = data.map((k: any) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }));
    useMarketStore.getState().setKlines(klines);
  } catch (e) {
    console.error('Failed to fetch klines:', e);
  }
}

async function fetchDepthSnapshot(symbol: string) {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`
    );
    const data = await res.json();
    const bids: OrderBookLevel[] = data.bids.map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1])
    }));
    const asks: OrderBookLevel[] = data.asks.map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1])
    }));
    useMarketStore.getState().setBids(bids);
    useMarketStore.getState().setAsks(asks);
  } catch (e) {
    console.error('Failed to fetch depth:', e);
  }
}
