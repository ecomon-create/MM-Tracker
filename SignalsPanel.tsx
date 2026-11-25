import { useMarketStore } from '../store/useMarketStore';

export default function SignalsPanel() {
  const signals = useMarketStore(s => s.signals);
  const clearSignals = useMarketStore(s => s.clearSignals);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breakout_up': return '🚀';
      case 'breakout_down': return '💥';
      case 'bounce_up': return '⬆️';
      case 'bounce_down': return '⬇️';
      case 'impulse_buy': return '🟢';
      case 'impulse_sell': return '🔴';
      case 'wall_removed': return '⚠️';
      case 'wall_placed': return '🧱';
      default: return '📊';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'breakout_up': return 'Прорыв ↑';
      case 'breakout_down': return 'Прорыв ↓';
      case 'bounce_up': return 'Отскок ↑';
      case 'bounce_down': return 'Отскок ↓';
      case 'impulse_buy': return 'Импульс BUY';
      case 'impulse_sell': return 'Импульс SELL';
      case 'wall_removed': return 'Стенка убрана';
      case 'wall_placed': return 'Стенка';
      default: return type;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      default: return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
    }
  };

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'high': return '🔥 Сильный';
      case 'medium': return '⚡ Средний';
      default: return '💡 Слабый';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
        <span className="text-xs text-gray-400">
          {signals.length} сигналов
        </span>
        <button
          onClick={clearSignals}
          className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          Очистить
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {signals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            <div className="text-center">
              <div className="text-3xl mb-2">📡</div>
              <div>Ожидание сигналов...</div>
              <div className="text-xs text-gray-700 mt-1">Анализ рынка в реальном времени</div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className={`p-2 rounded border text-xs ${getStrengthColor(signal.strength)} transition-all`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getTypeIcon(signal.type)}</span>
                  <span className="font-bold">{getTypeLabel(signal.type)}</span>
                  <span className="flex-1" />
                  <span className="text-[10px] opacity-70">{getStrengthLabel(signal.strength)}</span>
                </div>
                <div className="text-[11px] opacity-90 leading-relaxed">{signal.message}</div>
                <div className="text-[10px] opacity-50 mt-1">
                  {new Date(signal.time).toLocaleTimeString('ru-RU')} | Цена: {signal.price}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
