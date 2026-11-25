import { useMarketStore } from '../store/useMarketStore';

export default function TradeFlow() {
  const trades = useMarketStore(s => s.trades);
  
  // Show last 50 trades reversed (newest first)
  const recentTrades = trades.slice(-50).reverse();
  
  // Find large trades
  const avgQty = trades.length > 0 
    ? trades.slice(-200).reduce((s, t) => s + t.quantity * t.price, 0) / Math.min(trades.length, 200)
    : 0;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toFixed(2);
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
  };

  const formatVol = (v: number) => {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="flex flex-col h-full text-xs font-mono">
      <div className="grid grid-cols-4 gap-1 px-2 py-1 text-gray-500 border-b border-gray-800 text-[10px]">
        <span>Время</span>
        <span>Цена</span>
        <span className="text-right">Объём</span>
        <span className="text-right">USDT</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {recentTrades.map((trade, i) => {
          const usdVol = trade.price * trade.quantity;
          const isLarge = usdVol > avgQty * 3;
          const isHuge = usdVol > avgQty * 10;
          const isBuy = !trade.isBuyerMaker; // if buyer is not maker, it's a market buy
          
          return (
            <div
              key={`${trade.id}-${i}`}
              className={`grid grid-cols-4 gap-1 px-2 py-[2px] transition-colors
                ${isHuge ? (isBuy ? 'bg-green-500/20' : 'bg-red-500/20') : ''}
                ${isLarge && !isHuge ? (isBuy ? 'bg-green-500/10' : 'bg-red-500/10') : ''}
                hover:bg-gray-800/50
              `}
            >
              <span className="text-gray-500">{formatTime(trade.time)}</span>
              <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                {formatPrice(trade.price)}
              </span>
              <span className={`text-right ${isLarge ? 'font-bold' : ''} ${isBuy ? 'text-green-300' : 'text-red-300'}`}>
                {trade.quantity.toFixed(4)}
              </span>
              <span className={`text-right ${isHuge ? 'font-bold text-yellow-400' : isLarge ? 'font-bold' : 'text-gray-400'}`}>
                {isHuge && '🐋 '}{formatVol(usdVol)}
              </span>
            </div>
          );
        })}
        
        {recentTrades.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="text-center">
              <div className="text-2xl mb-1">📡</div>
              <div>Ожидание сделок...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
