import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useMarketStore } from '../store/useMarketStore';

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wallLinesRef = useRef<any[]>([]);
  const lastKlineCountRef = useRef<number>(0);
  
  const klines = useMarketStore(s => s.klines);
  const walls = useMarketStore(s => s.walls);
  const currentPrice = useMarketStore(s => s.currentPrice);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0e17' },
        textColor: '#a0aec0',
      },
      grid: {
        vertLines: { color: '#1a2332' },
        horzLines: { color: '#1a2332' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2d3748',
        autoScale: true,
      },
      timeScale: {
        borderColor: '#2d3748',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    
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

  // Update candle data and scroll to realtime
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current || klines.length === 0) return;
    
    const candleData = klines.map(k => ({
      time: k.time as any,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));
    
    const volumeData = klines.map(k => ({
      time: k.time as any,
      value: k.volume,
      color: k.close >= k.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
    }));
    
    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    
    // Auto-scroll to realtime when new candles appear
    if (klines.length !== lastKlineCountRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
      lastKlineCountRef.current = klines.length;
    }
  }, [klines]);

  // Update last candle in real-time with current price
  useEffect(() => {
    if (!candleSeriesRef.current || klines.length === 0 || currentPrice === 0) return;
    
    const lastKline = klines[klines.length - 1];
    if (!lastKline) return;
    
    // Update the last candle with current price
    const updatedCandle = {
      time: lastKline.time as any,
      open: lastKline.open,
      high: Math.max(lastKline.high, currentPrice),
      low: Math.min(lastKline.low, currentPrice),
      close: currentPrice,
    };
    
    candleSeriesRef.current.update(updatedCandle);
  }, [currentPrice, klines]);

  // Update wall lines
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    
    // Remove old lines
    for (const line of wallLinesRef.current) {
      try {
        candleSeriesRef.current.removePriceLine(line);
      } catch (_e) {
        // line might already be removed
      }
    }
    wallLinesRef.current = [];
    
    // Add new wall lines
    for (const wall of walls) {
      const color = wall.side === 'bid' 
        ? (wall.status === 'declining' ? '#fbbf24' : '#10b981')
        : (wall.status === 'declining' ? '#fbbf24' : '#ef4444');
      
      const lineWidth = Math.min(Math.max(Math.round(wall.strength / 2), 1), 4) as 1 | 2 | 3 | 4;
      
      const line = candleSeriesRef.current.createPriceLine({
        price: wall.price,
        color,
        lineWidth,
        lineStyle: wall.status === 'declining' ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title: `${wall.side === 'bid' ? 'SUP' : 'RES'} ${wall.strength.toFixed(1)}x`,
      });
      
      wallLinesRef.current.push(line);
    }
  }, [walls]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]" />
  );
}
