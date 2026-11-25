import { useEffect, useState, useCallback } from 'react';
import { useMarketStore } from './store/useMarketStore';
import { connectWebSockets, disconnectWebSockets, switchChartTF } from './services/binanceService';
import { startAnalysis, stopAnalysis } from './services/analysisEngine';
import PriceChart from './components/PriceChart';
import OrderBook from './components/OrderBook';
import ImpulseVolume from './components/ImpulseVolume';
import SignalsPanel from './components/SignalsPanel';
import WallsPanel from './components/WallsPanel';
import DepthHeatmap from './components/DepthHeatmap';
import TradeFlow from './components/TradeFlow';
import SettingsPanel from './components/SettingsPanel';
import HelpPanel from './components/HelpPanel';
import RaviChart from './components/RaviChart';

type Tab = 'orderbook' | 'walls' | 'trades';
type BottomTab = 'impulse' | 'signals' | 'depth';

export default function App() {
  const symbol = useMarketStore(s => s.symbol);
  const isConnected = useMarketStore(s => s.isConnected);
  const currentPrice = useMarketStore(s => s.currentPrice);
  const walls = useMarketStore(s => s.walls);
  const signals = useMarketStore(s => s.signals);
  const trades = useMarketStore(s => s.trades);
  
  const [showSettings, setShowSettings] = useState(false);
  const [rightTab, setRightTab] = useState<Tab>('orderbook');
  const [bottomTab, setBottomTab] = useState<BottomTab>('impulse');
  const [isRunning, setIsRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = useCallback(() => {
    connectWebSockets(symbol);
    startAnalysis();
    setIsRunning(true);
  }, [symbol]);

  const handleStop = useCallback(() => {
    disconnectWebSockets();
    stopAnalysis();
    setIsRunning(false);
  }, []);

  // Reconnect when symbol changes
  useEffect(() => {
    if (isRunning) {
      handleStop();
      setTimeout(() => handleStart(), 500);
    }
  }, [symbol]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSockets();
      stopAnalysis();
    };
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  const bidWalls = walls.filter(w => w.side === 'bid');
  const askWalls = walls.filter(w => w.side === 'ask');
  const highSignals = signals.filter(s => s.strength === 'high').length;

  return (
    <div className="h-screen w-screen bg-[#060a10] text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-[#0a0e17] border-b border-gray-800 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-black">
            MM
          </div>
          <div>
            <div className="text-sm font-bold leading-none">MM Tracker</div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">Market Maker Analyzer</div>
          </div>
        </div>
        
        <div className="w-px h-6 bg-gray-800" />
        
        {/* Symbol & Price */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm font-bold transition-colors"
          >
            {symbol.replace('USDT', '/USDT')}
          </button>
          
          {currentPrice > 0 && (
            <span className="text-lg font-bold font-mono text-white">
              ${formatPrice(currentPrice)}
            </span>
          )}
        </div>
        
        <div className="flex-1" />
        
        {/* Status indicators */}
        <div className="flex items-center gap-3 text-xs">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            {isConnected ? 'Подключено' : 'Отключено'}
          </div>
          
          {/* Wall count */}
          {walls.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">
              🧱 {walls.length} стенок
            </div>
          )}
          
          {/* Signals count */}
          {highSignals > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 animate-pulse">
              🔥 {highSignals} сильных
            </div>
          )}
          
          {/* Trades count */}
          <div className="text-gray-500">
            {trades.length} сделок
          </div>
        </div>
        
        <div className="w-px h-6 bg-gray-800" />
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/40"
            >
              ▶ Запустить
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-sm font-bold transition-all"
            >
              ■ Остановить
            </button>
          )}
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Настройки и экспорт"
          >
            ⚙️
          </button>
          
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Помощь и документация"
          >
            ❓
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chart + Bottom panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart with TF selector */}
          <div className="flex-1 min-h-0 flex flex-col">
            {isRunning && <ChartTFSelector />}
            <div className="flex-1 min-h-0">
            {isRunning ? (
              <PriceChart />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0a0e17]">
                <div className="text-center max-w-lg px-8">
                  <div className="text-6xl mb-4">🏦</div>
                  <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MM Tracker
                  </h1>
                  <h2 className="text-lg text-gray-400 mb-4">Анализ активности Маркет Мейкеров</h2>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Отслеживайте стенки в стакане ордеров, импульсные объёмы и действия крупных игроков.
                    Торгуйте вместе с Маркет Мейкерами, а не против них.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="text-sm font-bold text-green-400 mb-1">🧱 Стенки</div>
                      <div className="text-xs text-gray-500">Определение крупных лимитных ордеров в стакане</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="text-sm font-bold text-yellow-400 mb-1">📉 Динамика</div>
                      <div className="text-xs text-gray-500">Отслеживание снятия и усиления стенок</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="text-sm font-bold text-red-400 mb-1">🔥 Импульсы</div>
                      <div className="text-xs text-gray-500">Анализ потока маркет ордеров</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="text-sm font-bold text-blue-400 mb-1">📤 Экспорт</div>
                      <div className="text-xs text-gray-500">PineScript для TradingView, MQL4 для MT4</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStart}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-lg font-bold transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105"
                  >
                    🚀 Начать анализ {symbol.replace('USDT', '/USDT')}
                  </button>
                  
                  <p className="text-[10px] text-gray-600 mt-4">
                    Подключение к Binance WebSocket API • Данные в реальном времени • Без регистрации
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
          
          {/* RAVI Indicator */}
          {isRunning && (
            <div className="h-[130px] border-t border-gray-800 shrink-0">
              <RaviChart />
            </div>
          )}
          
          {/* Bottom Panel */}
          {isRunning && (
            <div className="h-[180px] border-t border-gray-800 bg-[#0a0e17] shrink-0">
              {/* Bottom tabs */}
              <div className="flex items-center gap-0.5 px-2 pt-1 border-b border-gray-800">
                <TabBtn active={bottomTab === 'impulse'} onClick={() => setBottomTab('impulse')}>
                  🔥 Импульсные объёмы
                </TabBtn>
                <TabBtn active={bottomTab === 'signals'} onClick={() => setBottomTab('signals')}>
                  📡 Сигналы {signals.length > 0 && <span className="ml-1 px-1 py-0.5 bg-blue-500/30 rounded text-[9px]">{signals.length}</span>}
                </TabBtn>
                <TabBtn active={bottomTab === 'depth'} onClick={() => setBottomTab('depth')}>
                  🌡️ Глубина
                </TabBtn>
              </div>
              
              <div className="h-[calc(100%-32px)] overflow-hidden">
                {bottomTab === 'impulse' && <ImpulseVolume />}
                {bottomTab === 'signals' && <SignalsPanel />}
                {bottomTab === 'depth' && <DepthHeatmap />}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel */}
        {isRunning && (
          <div className="w-[320px] border-l border-gray-800 bg-[#0a0e17] flex flex-col shrink-0">
            {/* Right tabs */}
            <div className="flex items-center gap-0.5 px-2 pt-1 border-b border-gray-800 shrink-0">
              <TabBtn active={rightTab === 'orderbook'} onClick={() => setRightTab('orderbook')}>
                📊 Стакан
              </TabBtn>
              <TabBtn active={rightTab === 'walls'} onClick={() => setRightTab('walls')}>
                🧱 Стенки {walls.length > 0 && <span className="ml-1 px-1 py-0.5 bg-yellow-500/30 rounded text-[9px]">{walls.length}</span>}
              </TabBtn>
              <TabBtn active={rightTab === 'trades'} onClick={() => setRightTab('trades')}>
                ⚡ Лента
              </TabBtn>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {rightTab === 'orderbook' && <OrderBook />}
              {rightTab === 'walls' && <WallsPanel />}
              {rightTab === 'trades' && <TradeFlow />}
            </div>
            
            {/* Quick Stats */}
            <div className="border-t border-gray-800 p-2 shrink-0">
              <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                <div className="p-1.5 rounded bg-green-500/10">
                  <div className="text-green-400 font-bold">{bidWalls.length}</div>
                  <div className="text-gray-500">Поддержка</div>
                </div>
                <div className="p-1.5 rounded bg-red-500/10">
                  <div className="text-red-400 font-bold">{askWalls.length}</div>
                  <div className="text-gray-500">Сопротивл.</div>
                </div>
                <div className="p-1.5 rounded bg-blue-500/10">
                  <div className="text-blue-400 font-bold">{signals.length}</div>
                  <div className="text-gray-500">Сигналы</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      
      {/* Help Modal */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-t transition-colors ${
        active 
          ? 'bg-gray-800 text-white border-t border-l border-r border-gray-700' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
      }`}
    >
      {children}
    </button>
  );
}

const CHART_TF_OPTIONS = [
  { value: '1m',  label: '1м' },
  { value: '3m',  label: '3м' },
  { value: '5m',  label: '5м' },
  { value: '15m', label: '15м' },
  { value: '30m', label: '30м' },
  { value: '1h',  label: '1ч' },
  { value: '4h',  label: '4ч' },
  { value: '1d',  label: '1д' },
];

function ChartTFSelector() {
  const chartTF = useMarketStore(s => s.chartTF);
  const setChartTF = useMarketStore(s => s.setChartTF);
  
  const handleChange = (tf: string) => {
    setChartTF(tf);
    switchChartTF(tf);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-[#0d1117] border-b border-gray-800 shrink-0">
      <span className="text-[10px] text-gray-500 mr-1">TF:</span>
      {CHART_TF_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
            chartTF === opt.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
