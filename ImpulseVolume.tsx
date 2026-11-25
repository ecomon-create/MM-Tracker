import { useMarketStore } from '../store/useMarketStore';

export default function ImpulseVolume() {
  const impulseCandles = useMarketStore(s => s.impulseCandles);
  const trades = useMarketStore(s => s.trades);
  const impulseTF = useMarketStore(s => s.impulseTF);
  
  const recentCandles = impulseCandles.slice(-40);
  const maxVol = Math.max(...recentCandles.map(c => Math.max(c.buyVolume, c.sellVolume)), 1);
  
  // Текущая открытая свеча (последняя) — показываем живые метрики
  const currentCandle = recentCandles.length > 0 ? recentCandles[recentCandles.length - 1] : null;
  const currentBuy = currentCandle?.buyVolume ?? 0;
  const currentSell = currentCandle?.sellVolume ?? 0;
  const currentTotal = currentBuy + currentSell;
  const buyPct = currentTotal > 0 ? (currentBuy / currentTotal) * 100 : 50;
  const currentDelta = currentBuy - currentSell;
  const currentTrades = currentCandle?.totalTrades ?? 0;
  
  const formatVol = (v: number) => {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with TF info */}
      <div className="flex items-center gap-3 px-3 py-1 border-b border-gray-800 text-[10px] text-gray-500">
        <span>Таймфрейм: <strong className="text-gray-300">{impulseTF}м</strong></span>
        <span>·</span>
        <span>Свечей: <strong className="text-gray-300">{recentCandles.length}</strong></span>
        <span>·</span>
        <span>Сделок в буфере: <strong className="text-gray-300">{trades.length}</strong></span>
      </div>
      
      {/* Current candle live metrics */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs border-b border-gray-800">
        <div>
          <div className="text-gray-500">Покупки ({impulseTF}м)</div>
          <div className="text-green-400 font-bold">{formatVol(currentBuy)}</div>
        </div>
        <div>
          <div className="text-gray-500">Продажи ({impulseTF}м)</div>
          <div className="text-red-400 font-bold">{formatVol(currentSell)}</div>
        </div>
        <div>
          <div className="text-gray-500">Дельта</div>
          <div className={`font-bold ${currentDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currentDelta >= 0 ? '+' : ''}{formatVol(Math.abs(currentDelta))}
          </div>
          <div className="text-gray-500">{currentTrades} сделок</div>
        </div>
      </div>
      
      {/* Buy/Sell pressure bar */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2 text-[10px] mb-1">
          <span className="text-green-400">Покупки {buyPct.toFixed(1)}%</span>
          <span className="flex-1" />
          <span className="text-red-400">Продажи {(100 - buyPct).toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
            style={{ width: `${buyPct}%` }}
          />
          <div 
            className="bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
            style={{ width: `${100 - buyPct}%` }}
          />
        </div>
      </div>
      
      {/* Impulse histogram */}
      <div className="flex-1 px-3 py-2 overflow-hidden">
        <div className="text-[10px] text-gray-500 mb-1">Импульсные объёмы по {impulseTF}м TF</div>
        <div className="flex items-end gap-[2px] h-[calc(100%-16px)]">
          {recentCandles.map((candle, i) => {
            const buyH = (candle.buyVolume / maxVol) * 100;
            const sellH = (candle.sellVolume / maxVol) * 100;
            const isBullish = candle.delta > 0;
            const isLast = i === recentCandles.length - 1;
            
            return (
              <div
                key={candle.time}
                className={`flex-1 flex flex-col justify-end items-center gap-[1px] min-w-0 ${isLast ? 'opacity-70' : ''}`}
                title={`${formatTime(candle.time)} | Buy: ${formatVol(candle.buyVolume)} | Sell: ${formatVol(candle.sellVolume)} | Δ: ${candle.delta >= 0 ? '+' : ''}${formatVol(Math.abs(candle.delta))} | ${candle.totalTrades} сделок${isLast ? ' (открыта)' : ''}`}
              >
                {/* Покупки сверху */}
                <div
                  className={`w-full rounded-t-[2px] ${isBullish ? 'bg-green-500' : 'bg-green-500/40'}`}
                  style={{ height: `${Math.max(buyH, 1)}%` }}
                />
                {/* Продажи снизу */}
                <div
                  className={`w-full rounded-t-[2px] ${!isBullish ? 'bg-red-500' : 'bg-red-500/40'}`}
                  style={{ height: `${Math.max(sellH, 1)}%` }}
                />
                {/* Time label for wider candles */}
                {recentCandles.length <= 20 && (
                  <div className="text-[8px] text-gray-600 mt-0.5 truncate w-full text-center">
                    {formatTime(candle.time)}
                  </div>
                )}
              </div>
            );
          })}
          
          {recentCandles.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
              Ожидание данных...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
