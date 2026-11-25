import { useMarketStore } from '../store/useMarketStore';

export default function DepthHeatmap() {
  const bids = useMarketStore(s => s.bids);
  const asks = useMarketStore(s => s.asks);
  const walls = useMarketStore(s => s.walls);
  
  const allLevels = [...bids, ...asks];
  const maxQty = Math.max(...allLevels.map(l => l.quantity), 0.001);
  const wallPrices = new Set(walls.map(w => w.price));

  // Build depth visualization data
  const bidData = bids.map(b => ({
    price: b.price,
    quantity: b.quantity,
    side: 'bid' as const,
    intensity: b.quantity / maxQty,
    isWall: wallPrices.has(b.price),
  }));

  const askData = asks.map(a => ({
    price: a.price,
    quantity: a.quantity,
    side: 'ask' as const,
    intensity: a.quantity / maxQty,
    isWall: wallPrices.has(a.price),
  }));

  const getHeatColor = (intensity: number, side: 'bid' | 'ask') => {
    const alpha = Math.min(intensity * 1.5, 1);
    if (side === 'bid') {
      if (intensity > 0.7) return `rgba(16, 185, 129, ${alpha})`;
      if (intensity > 0.4) return `rgba(16, 185, 129, ${alpha * 0.7})`;
      return `rgba(16, 185, 129, ${alpha * 0.4})`;
    } else {
      if (intensity > 0.7) return `rgba(239, 68, 68, ${alpha})`;
      if (intensity > 0.4) return `rgba(239, 68, 68, ${alpha * 0.7})`;
      return `rgba(239, 68, 68, ${alpha * 0.4})`;
    }
  };

  // Cumulative depth
  let bidCum = 0;
  const bidCumData = bidData.map(b => {
    bidCum += b.quantity;
    return { ...b, cumulative: bidCum };
  });

  let askCum = 0;
  const askCumData = askData.map(a => {
    askCum += a.quantity;
    return { ...a, cumulative: askCum };
  });

  const maxCum = Math.max(bidCum, askCum, 0.001);

  return (
    <div className="flex flex-col h-full">
      {/* Depth Heatmap */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="text-[10px] text-gray-500 mb-1.5">Тепловая карта глубины</div>
        <div className="flex gap-[1px]">
          {/* Bids heatmap (reversed - highest bid first) */}
          <div className="flex-1 flex gap-[1px]">
            {[...bidData].reverse().map((level, i) => (
              <div
                key={`bh-${i}`}
                className={`flex-1 h-8 rounded-[2px] ${level.isWall ? 'ring-1 ring-yellow-400/70' : ''}`}
                style={{ backgroundColor: getHeatColor(level.intensity, 'bid') }}
                title={`${level.price}: ${level.quantity} ${level.isWall ? '(СТЕНКА!)' : ''}`}
              />
            ))}
          </div>
          <div className="w-[2px] bg-gray-600" />
          {/* Asks heatmap */}
          <div className="flex-1 flex gap-[1px]">
            {askData.map((level, i) => (
              <div
                key={`ah-${i}`}
                className={`flex-1 h-8 rounded-[2px] ${level.isWall ? 'ring-1 ring-yellow-400/70' : ''}`}
                style={{ backgroundColor: getHeatColor(level.intensity, 'ask') }}
                title={`${level.price}: ${level.quantity} ${level.isWall ? '(СТЕНКА!)' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
          <span>← Поддержка</span>
          <span>Спред</span>
          <span>Сопротивление →</span>
        </div>
      </div>
      
      {/* Cumulative depth chart */}
      <div className="flex-1 px-3 py-2">
        <div className="text-[10px] text-gray-500 mb-1.5">Кумулятивная глубина</div>
        <div className="h-[calc(100%-20px)] flex items-end gap-[1px]">
          {/* Bids cumulative (reversed) */}
          {[...bidCumData].reverse().map((level, i) => {
            const h = (level.cumulative / maxCum) * 100;
            return (
              <div
                key={`bc-${i}`}
                className={`flex-1 rounded-t-[2px] transition-all duration-300 ${level.isWall ? 'ring-1 ring-yellow-400/50' : ''}`}
                style={{
                  height: `${h}%`,
                  backgroundColor: level.isWall ? 'rgba(251, 191, 36, 0.6)' : 'rgba(16, 185, 129, 0.4)',
                }}
                title={`${level.price}: Cum ${level.cumulative.toFixed(4)}`}
              />
            );
          })}
          
          <div className="w-[2px] bg-gray-600 self-stretch" />
          
          {/* Asks cumulative */}
          {askCumData.map((level, i) => {
            const h = (level.cumulative / maxCum) * 100;
            return (
              <div
                key={`ac-${i}`}
                className={`flex-1 rounded-t-[2px] transition-all duration-300 ${level.isWall ? 'ring-1 ring-yellow-400/50' : ''}`}
                style={{
                  height: `${h}%`,
                  backgroundColor: level.isWall ? 'rgba(251, 191, 36, 0.6)' : 'rgba(239, 68, 68, 0.4)',
                }}
                title={`${level.price}: Cum ${level.cumulative.toFixed(4)}`}
              />
            );
          })}
        </div>
      </div>
      
      {/* Imbalance indicator */}
      <div className="px-3 py-2 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Дисбаланс:</span>
          <div className="flex-1">
            {(() => {
              const bidTotal = bidData.reduce((s, b) => s + b.quantity, 0);
              const askTotal = askData.reduce((s, a) => s + a.quantity, 0);
              const total = bidTotal + askTotal;
              const bidPct = total > 0 ? (bidTotal / total) * 100 : 50;
              const imbalance = total > 0 ? ((bidTotal - askTotal) / total) * 100 : 0;
              
              return (
                <>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                    <div className="bg-green-500 transition-all duration-500" style={{ width: `${bidPct}%` }} />
                    <div className="bg-red-500 transition-all duration-500" style={{ width: `${100 - bidPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] mt-0.5">
                    <span className="text-green-500">BID {bidPct.toFixed(1)}%</span>
                    <span className={imbalance > 0 ? 'text-green-400' : 'text-red-400'}>
                      {imbalance > 10 ? '🟢 Быки' : imbalance < -10 ? '🔴 Медведи' : '⚪ Баланс'}
                    </span>
                    <span className="text-red-500">ASK {(100 - bidPct).toFixed(1)}%</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
