import { useMarketStore } from '../store/useMarketStore';

export default function WallsPanel() {
  const walls = useMarketStore(s => s.walls);
  const currentPrice = useMarketStore(s => s.currentPrice);
  
  const bidWalls = walls.filter(w => w.side === 'bid').sort((a, b) => b.price - a.price);
  const askWalls = walls.filter(w => w.side === 'ask').sort((a, b) => a.price - b.price);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toFixed(2);
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  const formatQty = (q: number) => {
    if (q >= 1000) return q.toFixed(2);
    if (q >= 1) return q.toFixed(4);
    return q.toFixed(6);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'growing':
        return <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">📈 Растёт</span>;
      case 'declining':
        return <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400">📉 Снижается</span>;
      default:
        return <span className="text-[9px] px-1 py-0.5 rounded bg-gray-500/20 text-gray-400">— Стабильна</span>;
    }
  };

  const getDistanceFromPrice = (wallPrice: number) => {
    if (currentPrice === 0) return '';
    const pct = ((wallPrice - currentPrice) / currentPrice) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  };

  const maxStrength = Math.max(...walls.map(w => w.strength), 1);

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2 border-b border-gray-800">
        <div className="text-center p-2 rounded bg-green-500/10 border border-green-500/20">
          <div className="text-green-400 font-bold text-lg">{bidWalls.length}</div>
          <div className="text-green-500/70 text-[10px]">Стенки поддержки</div>
        </div>
        <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-red-400 font-bold text-lg">{askWalls.length}</div>
          <div className="text-red-500/70 text-[10px]">Стенки сопротивления</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {walls.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <div className="text-3xl mb-2">🧱</div>
              <div>Стенки не обнаружены</div>
              <div className="text-[10px] text-gray-700 mt-1">Увеличьте чувствительность или дождитесь данных</div>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Ask walls (resistance above price) */}
            {askWalls.length > 0 && (
              <>
                <div className="text-red-500/70 text-[10px] font-bold px-1 pt-1">▲ СОПРОТИВЛЕНИЕ</div>
                {askWalls.map((wall, i) => (
                  <div key={`ask-${i}`} className="p-2 rounded bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-400 font-bold">{formatPrice(wall.price)}</span>
                      <span className="text-gray-500 text-[10px]">{getDistanceFromPrice(wall.price)}</span>
                      <span className="flex-1" />
                      {getStatusBadge(wall.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${(wall.strength / maxStrength) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-gray-400 text-[10px] w-10 text-right">{wall.strength.toFixed(1)}x</span>
                    </div>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Объём: {formatQty(wall.quantity)} | USDT: ${(wall.price * wall.quantity).toFixed(0)}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Current price separator */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-gray-400 text-[10px]">ЦЕНА: {formatPrice(currentPrice)}</span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>
            
            {/* Bid walls (support below price) */}
            {bidWalls.length > 0 && (
              <>
                <div className="text-green-500/70 text-[10px] font-bold px-1">▼ ПОДДЕРЖКА</div>
                {bidWalls.map((wall, i) => (
                  <div key={`bid-${i}`} className="p-2 rounded bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-400 font-bold">{formatPrice(wall.price)}</span>
                      <span className="text-gray-500 text-[10px]">{getDistanceFromPrice(wall.price)}</span>
                      <span className="flex-1" />
                      {getStatusBadge(wall.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(wall.strength / maxStrength) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-gray-400 text-[10px] w-10 text-right">{wall.strength.toFixed(1)}x</span>
                    </div>
                    <div className="text-gray-500 text-[10px] mt-1">
                      Объём: {formatQty(wall.quantity)} | USDT: ${(wall.price * wall.quantity).toFixed(0)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
