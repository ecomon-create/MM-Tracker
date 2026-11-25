import { useMarketStore } from '../store/useMarketStore';
import { generatePineScript, generateMQL4, downloadFile } from '../services/exportService';

const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'ATOMUSDT', 'APTUSDT',
];

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const symbol = useMarketStore(s => s.symbol);
  const setSymbol = useMarketStore(s => s.setSymbol);
  const wallThreshold = useMarketStore(s => s.wallThreshold);
  const setWallThreshold = useMarketStore(s => s.setWallThreshold);
  const soundEnabled = useMarketStore(s => s.soundEnabled);
  const setSoundEnabled = useMarketStore(s => s.setSoundEnabled);
  const minWallUsd = useMarketStore(s => s.minWallUsd);
  const setMinWallUsd = useMarketStore(s => s.setMinWallUsd);
  const signalCooldown = useMarketStore(s => s.signalCooldown);
  const setSignalCooldown = useMarketStore(s => s.setSignalCooldown);
  const impulseTF = useMarketStore(s => s.impulseTF);
  const setImpulseTF = useMarketStore(s => s.setImpulseTF);

  const handleExportPineScript = () => {
    const code = generatePineScript();
    downloadFile(code, `MM_Tracker_${symbol}.pine`);
  };

  const handleExportMQL4 = () => {
    const code = generateMQL4();
    downloadFile(code, `MM_Tracker_${symbol}.mq4`);
  };

  const handleCopyPineScript = () => {
    const code = generatePineScript();
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">⚙️ Настройки & Экспорт</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Symbol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">🪙 Торговая пара</label>
            <div className="grid grid-cols-5 gap-1.5">
              {SYMBOLS.map(s => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    symbol === s 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {s.replace('USDT', '')}
                </button>
              ))}
            </div>
          </div>
          
          {/* Wall Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🧱 Порог стенки: <span className="text-blue-400">{wallThreshold}x</span> от среднего объёма
            </label>
            <input
              type="range"
              min="1.5"
              max="10"
              step="0.5"
              value={wallThreshold}
              onChange={e => setWallThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>1.5x (чувств.)</span>
              <span>5x (умерен.)</span>
              <span>10x (только крупные)</span>
            </div>
          </div>
          
          {/* Impulse TF */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📊 Таймфрейм импульсных свечей: <span className="text-blue-400">{impulseTF}м</span>
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 3, 5, 15, 30, 60].map(tf => (
                <button
                  key={tf}
                  onClick={() => setImpulseTF(tf)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    impulseTF === tf
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {tf}м
                </button>
              ))}
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              Все сделки агрегируются в одну свечу за выбранный период. Сигнал — не чаще 1 раза в TF.
            </div>
          </div>
          
          {/* Sound */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">🔔 Звуковые уведомления</label>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          
          {/* Min Wall USD */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              💰 Мин. стоимость стенки для сигнала: <span className="text-blue-400">${(minWallUsd/1000).toFixed(0)}K</span>
            </label>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={minWallUsd}
              onChange={e => setMinWallUsd(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>$10K (много сигналов)</span>
              <span>$100K</span>
              <span>$1M (только крупные)</span>
            </div>
          </div>
          
          {/* Signal Cooldown */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ⏱️ Пауза между сигналами: <span className="text-blue-400">{signalCooldown}с</span>
            </label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={signalCooldown}
              onChange={e => setSignalCooldown(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>5с (часто)</span>
              <span>60с</span>
              <span>120с (редко)</span>
            </div>
          </div>
          
          {/* Export Section */}
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-white mb-3">📤 Экспорт для торговых платформ</h3>
            
            {/* TradingView */}
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-white">TradingView (PineScript v5)</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">
                Генерирует индикатор с текущими стенками, импульсными объёмами и алертами.
                Скопируйте код и вставьте в редактор Pine Script на TradingView.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPineScript}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  💾 Скачать .pine
                </button>
                <button
                  onClick={handleCopyPineScript}
                  className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs font-medium transition-colors"
                >
                  📋 Копировать код
                </button>
              </div>
            </div>
            
            {/* MT4 */}
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏦</span>
                <span className="text-sm font-medium text-white">MetaTrader 4 (MQL4)</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">
                Генерирует пользовательский индикатор с уровнями стенок и импульсными сигналами.
                Скачайте файл .mq4 и поместите в папку MQL4/Indicators.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportMQL4}
                  className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
                >
                  💾 Скачать .mq4
                </button>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-blue-300 leading-relaxed">
                <strong>💡 Рекомендация:</strong> Экспортируемые скрипты содержат <em>текущие</em> уровни стенок.
                Регулярно обновляйте их, так как маркет мейкеры постоянно перемещают свои ордера.
                Используйте веб-приложение для мониторинга в реальном времени, а скрипты — для быстрого нанесения уровней.
              </div>
            </div>
          </div>
          
          {/* How it works */}
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-white mb-3">📖 Как это работает</h3>
            <div className="space-y-2 text-[11px] text-gray-400">
              <div className="p-2 rounded bg-gray-800/50">
                <strong className="text-green-400">🧱 Стенки (Walls)</strong> — уровни в стакане ордеров, где объём 
                значительно выше среднего ({wallThreshold}x). Маркет мейкеры ставят крупные ордера для создания 
                ложных уровней поддержки/сопротивления.
              </div>
              <div className="p-2 rounded bg-gray-800/50">
                <strong className="text-yellow-400">📉 Снятие стенок</strong> — когда объём на стенке начинает снижаться,
                это сигнал, что маркет мейкер готовит прорыв. Он убирает свой ордер перед движением цены.
              </div>
              <div className="p-2 rounded bg-gray-800/50">
                <strong className="text-red-400">🔥 Импульсные объёмы</strong> — всплеск маркет ордеров (рыночных).
                Высокая частота и объём = давление маркет мейкеров на цену в определённом направлении.
              </div>
              <div className="p-2 rounded bg-gray-800/50">
                <strong className="text-blue-400">📊 Дисбаланс</strong> — соотношение объёмов BID/ASK. Если покупатели
                сильнее продавцов — бычий сигнал. И наоборот.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
