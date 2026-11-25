import { useEffect, useRef, useMemo, useCallback } from 'react';
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineSeries } from 'lightweight-charts';
import { useMarketStore } from '../store/useMarketStore';

/**
 * RAVI = ((SMA(fast) - SMA(slow)) / SMA(slow)) * 100
 */
function calcSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

function calcRAVI(closes: number[], fast: number, slow: number): (number | null)[] {
  const smaFast = calcSMA(closes, fast);
  const smaSlow = calcSMA(closes, slow);
  const result: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    const f = smaFast[i];
    const s = smaSlow[i];
    if (f === null || s === null || s === 0) {
      result.push(null);
    } else {
      result.push(((f - s) / s) * 100);
    }
  }
  return result;
}

interface CrossSignal {
  time: number;
  type: 'buy' | 'sell';
}

export default function RaviChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const ravi1SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ravi2SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const zeroSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lastCrossRef = useRef<string>(''); // Запоминаем последнее пересечение
  
  const klines = useMarketStore(s => s.klines);
  const soundEnabled = useMarketStore(s => s.soundEnabled);
  const addSignal = useMarketStore(s => s.addSignal);
  
  // Рассчитываем RAVI
  const raviData = useMemo(() => {
    if (klines.length < 50) return { ravi1: [], ravi2: [], crosses: [] as CrossSignal[] };
    
    const closes = klines.map(k => k.close);
    const ravi1 = calcRAVI(closes, 1, 49);  // быстрый
    const ravi2 = calcRAVI(closes, 4, 49);  // медленный
    
    // Находим пересечения
    const crosses: CrossSignal[] = [];
    for (let i = 1; i < ravi1.length; i++) {
      const prev1 = ravi1[i - 1];
      const prev2 = ravi2[i - 1];
      const curr1 = ravi1[i];
      const curr2 = ravi2[i];
      
      if (prev1 === null || prev2 === null || curr1 === null || curr2 === null) continue;
      
      // Быстрая пересекла медленную снизу вверх → BUY
      if (prev1 <= prev2 && curr1 > curr2) {
        crosses.push({ time: klines[i].time, type: 'buy' });
      }
      // Быстрая пересекла медленную сверху вниз → SELL
      if (prev1 >= prev2 && curr1 < curr2) {
        crosses.push({ time: klines[i].time, type: 'sell' });
      }
    }
    
    return { ravi1, ravi2, crosses };
  }, [klines]);

  // Создаём график
  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#080c14' },
        textColor: '#6b7280',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#111827' },
        horzLines: { color: '#111827' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: '#1f2937',
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
        visible: false, // Скрываем шкалу времени (она на основном графике)
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    
    // RAVI(1/49) — быстрая линия
    const ravi1Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',  // жёлтая
      lineWidth: 2,
      title: 'RAVI 1/49',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    });
    
    // RAVI(4/49) — медленная линия
    const ravi2Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',  // синяя
      lineWidth: 2,
      title: 'RAVI 4/49',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
    });
    
    // Нулевая линия
    const zeroSeries = chart.addSeries(LineSeries, {
      color: '#374151',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: '',
      priceFormat: { type: 'price', precision: 3, minMove: 0.001 },
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    
    chartRef.current = chart;
    ravi1SeriesRef.current = ravi1Series;
    ravi2SeriesRef.current = ravi2Series;
    zeroSeriesRef.current = zeroSeries;
    
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Обновляем данные
  useEffect(() => {
    if (!ravi1SeriesRef.current || !ravi2SeriesRef.current || !zeroSeriesRef.current) return;
    if (klines.length < 50) return;
    
    const { ravi1, ravi2 } = raviData;
    
    const data1: any[] = [];
    const data2: any[] = [];
    const dataZero: any[] = [];
    
    for (let i = 0; i < klines.length; i++) {
      const time = klines[i].time as any;
      if (ravi1[i] !== null) {
        data1.push({ time, value: ravi1[i] });
      }
      if (ravi2[i] !== null) {
        data2.push({ time, value: ravi2[i] });
      }
      dataZero.push({ time, value: 0 });
    }
    
    ravi1SeriesRef.current.setData(data1);
    ravi2SeriesRef.current.setData(data2);
    zeroSeriesRef.current.setData(dataZero);
  }, [klines, raviData]);

  // Обрабатываем пересечения — сигналы
  const playCrossSound = useCallback((type: 'buy' | 'sell') => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'buy') {
        osc.frequency.value = 523;   // C5
        gain.gain.value = 0.15;
      } else {
        osc.frequency.value = 392;   // G4
        gain.gain.value = 0.15;
      }
      osc.type = 'triangle';
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      // Второй тон
      setTimeout(() => {
        try {
          const ctx2 = new AudioContext();
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.frequency.value = type === 'buy' ? 659 : 330; // E5 or E4
          gain2.gain.value = 0.15;
          osc2.type = 'triangle';
          osc2.start();
          osc2.stop(ctx2.currentTime + 0.2);
          setTimeout(() => ctx2.close(), 300);
        } catch (_) {}
      }, 180);
      
      setTimeout(() => ctx.close(), 300);
    } catch (_) {}
  }, [soundEnabled]);

  useEffect(() => {
    if (raviData.crosses.length === 0) return;
    
    const lastCross = raviData.crosses[raviData.crosses.length - 1];
    const crossKey = `${lastCross.time}_${lastCross.type}`;
    
    if (crossKey !== lastCrossRef.current) {
      lastCrossRef.current = crossKey;
      
      const price = klines.length > 0 ? klines[klines.length - 1].close : 0;
      
      addSignal({
        id: `ravi_${Date.now()}`,
        time: Date.now(),
        type: lastCross.type === 'buy' ? 'breakout_up' : 'breakout_down',
        price,
        message: `📐 RAVI: Тренд сменился на ${lastCross.type === 'buy' ? '🟢 ВОСХОДЯЩИЙ' : '🔴 НИСХОДЯЩИЙ'}! Пересечение 1/49 и 4/49`,
        strength: 'high',
      });
      
      playCrossSound(lastCross.type);
    }
  }, [raviData.crosses, klines, addSignal, playCrossSound]);

  // Последнее пересечение для отображения
  const lastCross = raviData.crosses.length > 0 ? raviData.crosses[raviData.crosses.length - 1] : null;
  const lastRavi1 = raviData.ravi1.length > 0 ? raviData.ravi1[raviData.ravi1.length - 1] : null;
  const lastRavi2 = raviData.ravi2.length > 0 ? raviData.ravi2[raviData.ravi2.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-[#080c14]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-500 font-bold">RAVI</span>
          <span className="text-yellow-400">━ 1/49: {lastRavi1 !== null ? lastRavi1.toFixed(3) : '—'}</span>
          <span className="text-blue-400">━ 4/49: {lastRavi2 !== null ? lastRavi2.toFixed(3) : '—'}</span>
        </div>
        <div className="text-[10px]">
          {lastCross ? (
            <span className={`px-2 py-0.5 rounded font-bold ${
              lastCross.type === 'buy'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {lastCross.type === 'buy' ? '▲ ВОСХОДЯЩИЙ' : '▼ НИСХОДЯЩИЙ'} тренд
            </span>
          ) : (
            <span className="text-gray-600">Ожидание...</span>
          )}
        </div>
      </div>
      
      {/* Chart */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
