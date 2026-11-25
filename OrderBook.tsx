import { useMemo } from 'react';
import { useMarketStore } from '../store/useMarketStore';

export default function OrderBook() {
  const bids = useMarketStore(s => s.bids);
  const asks = useMarketStore(s => s.asks);
  const walls = useMarketStore(s => s.walls);
  const currentPrice = useMarketStore(s => s.currentPrice);
  const priceStep = useMarketStore(s => s.priceStep);
  const minWallUsd = useMarketStore(s => s.minWallUsd);
  
  // Группировка уровней по шагу цены
  const groupedData = useMemo(() => {
    const step = priceStep;
    
    // Группируем bids
    const bidGroups = new Map<number, { price: number; quantity: number; usdValue: number }>();
    for (const bid of bids) {
      const groupPrice = Math.floor(bid.price / step) * step;
      const existing = bidGroups.get(groupPrice);
      const usdVal = bid.price * bid.quantity;
      if (existing) {
        existing.quantity += bid.quantity;
        existing.usdValue += usdVal;
      } else {
        bidGroups.set(groupPrice, { price: groupPrice, quantity: bid.quantity, usdValue: usdVal });
      }
    }
    
    // Группируем asks
    const askGroups = new Map<number, { price: number; quantity: number; usdValue: number }>();
    for (const ask of asks) {
      const groupPrice = Math.floor(ask.price / step) * step;
      const existing = askGroups.get(groupPrice);
      const usdVal = ask.price * ask.quantity;
      if (existing) {
        existing.quantity += ask.quantity;
        existing.usdValue += usdVal;
      } else {
        askGroups.set(groupPrice, { price: groupPrice, quantity: ask.quantity, usdValue: usdVal });
      }
    }
    
    const groupedBids = Array.from(bidGroups.values()).sort((a, b) => b.price - a.price);
    const groupedAsks = Array.from(askGroups.values()).sort((a, b) => a.price - b.price);
    
    return { bids: groupedBids, asks: groupedAsks };
  }, [bids, asks, priceStep]);
  
  const wallPriceSet = useMemo(() => {
    const set = new Set<number>();
    for (const w of walls) {
      const groupPrice = Math.floor(w.price / priceStep) * priceStep;
      set.add(groupPrice);
    }
    return set;
  }, [walls, priceStep]);
  
  const getWallInfo = (price: number) => {
    const step = priceStep;
    return walls.find(w => Math.floor(w.price / step) * step === price);
  };
  
  const maxUsd = Math.max(
    ...groupedData.bids.map(b => b.usdValue),
    ...groupedData.asks.map(a => a.usdValue),
    1
  );

  // Форматирование цены — для BTC без десятичных
  const formatPrice = (p: number) => {
    if (currentPrice >= 1000) return p.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
    if (currentPrice >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  const formatUsd = (v: number) => {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const formatQty = (q: number) => {
    if (q >= 1000) return q.toFixed(1);
    if (q >= 1) return q.toFixed(2);
    return q.toFixed(4);
  };

  // Определение "китовости" уровня
  const getWhaleTier = (usdValue: number): 'normal' | 'large' | 'whale' => {
    if (usdValue >= minWallUsd * 10) return 'whale';  // Кит (например >$1M)
    if (usdValue >= minWallUsd * 3) return 'large';   // Крупный (>$300K)
    return 'normal';
  };

  const getRowStyle = (usdValue: number, side: 'bid' | 'ask', isWall: boolean) => {
    const tier = getWhaleTier(usdValue);
    
    if (tier === 'whale') {
      return side === 'bid' 
        ? 'bg-green-500/30 ring-2 ring-green-400 animate-pulse'
        : 'bg-red-500/30 ring-2 ring-red-400 animate-pulse';
    }
    if (tier === 'large' || isWall) {
      return side === 'bid'
        ? 'bg-green-500/20 ring-1 ring-green-500/50'
        : 'bg-red-500/20 ring-1 ring-red-500/50';
    }
    return '';
  };

  const getPriceColor = (usdValue: number, side: 'bid' | 'ask') => {
    const tier = getWhaleTier(usdValue);
    if (tier === 'whale') return 'text-yellow-300 font-black text-sm';
    if (tier === 'large') return side === 'bid' ? 'text-green-300 font-bold' : 'text-red-300 font-bold';
    return side === 'bid' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="flex flex-col h-full text-xs font-mono">
      {/* Header with price step selector */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800 bg-gray-900/50">
        <span className="text-gray-500 text-[10px]">Шаг цены:</span>
        <div className="flex gap-1">
          {[1, 10, 50, 100, 500].map(step => (
            <button
              key={step}
              onClick={() => useMarketStore.getState().setPriceStep(step)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                priceStep === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1 px-2 py-1 text-gray-500 border-b border-gray-800 text-[10px]">
        <span>Цена</span>
        <span className="text-right">Объём</span>
        <span className="text-right">USD</span>
      </div>
      
      {/* Asks (продажи) — снизу вверх */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {[...groupedData.asks].reverse().slice(0, 12).map((ask) => {
          const isWall = wallPriceSet.has(ask.price);
          const wallInfo = getWallInfo(ask.price);
          const pct = (ask.usdValue / maxUsd) * 100;
          const tier = getWhaleTier(ask.usdValue);
          
          // Показываем только значимые уровни или все если их мало
          if (tier === 'normal' && !isWall && groupedData.asks.length > 8) return null;
          
          return (
            <div
              key={`ask-${ask.price}`}
              className={`grid grid-cols-3 gap-1 px-2 py-[3px] relative transition-all ${getRowStyle(ask.usdValue, 'ask', isWall)}`}
            >
              <div
                className="absolute inset-0 bg-red-500/10 transition-all"
                style={{ width: `${pct}%`, right: 0, left: 'auto' }}
              />
              <span className={`relative z-10 ${getPriceColor(ask.usdValue, 'ask')}`}>
                {formatPrice(ask.price)}
                {wallInfo && wallInfo.status === 'declining' && <span className="ml-1">📉</span>}
                {tier === 'whale' && <span className="ml-1">🐋</span>}
              </span>
              <span className="relative z-10 text-right text-gray-300">{formatQty(ask.quantity)}</span>
              <span className={`relative z-10 text-right ${tier !== 'normal' ? 'text-white font-bold' : 'text-gray-400'}`}>
                {formatUsd(ask.usdValue)}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current Price */}
      <div className="px-2 py-2 bg-gray-800/80 border-y border-gray-600 text-center">
        <span className="text-xl font-black text-white">{formatPrice(currentPrice)}</span>
        <span className="text-gray-500 ml-2 text-sm">USDT</span>
      </div>
      
      {/* Bids (покупки) */}
      <div className="flex-1 overflow-hidden">
        {groupedData.bids.slice(0, 12).map((bid) => {
          const isWall = wallPriceSet.has(bid.price);
          const wallInfo = getWallInfo(bid.price);
          const pct = (bid.usdValue / maxUsd) * 100;
          const tier = getWhaleTier(bid.usdValue);
          
          // Показываем только значимые уровни
          if (tier === 'normal' && !isWall && groupedData.bids.length > 8) return null;
          
          return (
            <div
              key={`bid-${bid.price}`}
              className={`grid grid-cols-3 gap-1 px-2 py-[3px] relative transition-all ${getRowStyle(bid.usdValue, 'bid', isWall)}`}
            >
              <div
                className="absolute inset-0 bg-green-500/10 transition-all"
                style={{ width: `${pct}%`, right: 0, left: 'auto' }}
              />
              <span className={`relative z-10 ${getPriceColor(bid.usdValue, 'bid')}`}>
                {formatPrice(bid.price)}
                {wallInfo && wallInfo.status === 'declining' && <span className="ml-1">📉</span>}
                {tier === 'whale' && <span className="ml-1">🐋</span>}
              </span>
              <span className="relative z-10 text-right text-gray-300">{formatQty(bid.quantity)}</span>
              <span className={`relative z-10 text-right ${tier !== 'normal' ? 'text-white font-bold' : 'text-gray-400'}`}>
                {formatUsd(bid.usdValue)}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="px-2 py-1 border-t border-gray-800 text-[9px] text-gray-600 flex items-center gap-2">
        <span>🐋 Кит (&gt;${(minWallUsd * 10 / 1000).toFixed(0)}K)</span>
        <span>|</span>
        <span>📉 Едят</span>
      </div>
    </div>
  );
}
