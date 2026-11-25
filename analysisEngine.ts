import { useMarketStore, type Wall, type ImpulseCandle, type Signal } from '../store/useMarketStore';

let analysisInterval: ReturnType<typeof setInterval> | null = null;
let previousWalls: Map<number, { quantity: number; usdValue: number; timestamp: number }> = new Map();
let lastSignalTimes: Map<string, number> = new Map();
let lastImpulseCandleTime = 0;

// Порог изменения объёма для сигнала "съедания" (20% падение)
const EATING_THRESHOLD = 0.2;

export function startAnalysis() {
  stopAnalysis();
  
  analysisInterval = setInterval(() => {
    analyzeWalls();
    analyzeImpulse();
  }, 1000);
}

export function stopAnalysis() {
  if (analysisInterval) {
    clearInterval(analysisInterval);
    analysisInterval = null;
  }
  previousWalls = new Map();
  lastSignalTimes = new Map();
  lastImpulseCandleTime = 0;
}

function canEmitSignal(signalKey: string): boolean {
  const state = useMarketStore.getState();
  const cooldownMs = state.signalCooldown * 1000;
  
  const lastTime = lastSignalTimes.get(signalKey);
  const now = Date.now();
  if (!lastTime || now - lastTime > cooldownMs) {
    lastSignalTimes.set(signalKey, now);
    return true;
  }
  return false;
}

function analyzeWalls() {
  const state = useMarketStore.getState();
  const { bids, asks, currentPrice, minWallUsd, priceStep } = state;
  
  if (bids.length === 0 || asks.length === 0) return;
  
  const allLevels = [...bids, ...asks];
  const avgQuantity = allLevels.reduce((sum, l) => sum + l.quantity, 0) / allLevels.length;
  
  if (avgQuantity === 0) return;
  
  const now = Date.now();
  const walls: Wall[] = [];
  
  // Группируем уровни по priceStep для анализа
  const groupedLevels = new Map<number, { quantity: number; usdValue: number; side: 'bid' | 'ask'; originalPrice: number }>();
  
  for (const bid of bids) {
    const groupPrice = Math.floor(bid.price / priceStep) * priceStep;
    const usd = bid.price * bid.quantity;
    const existing = groupedLevels.get(groupPrice);
    if (existing) {
      existing.quantity += bid.quantity;
      existing.usdValue += usd;
    } else {
      groupedLevels.set(groupPrice, { quantity: bid.quantity, usdValue: usd, side: 'bid', originalPrice: bid.price });
    }
  }
  
  for (const ask of asks) {
    const groupPrice = Math.floor(ask.price / priceStep) * priceStep;
    const usd = ask.price * ask.quantity;
    const existing = groupedLevels.get(groupPrice);
    if (existing && existing.side === 'ask') {
      existing.quantity += ask.quantity;
      existing.usdValue += usd;
    } else if (!existing) {
      groupedLevels.set(groupPrice, { quantity: ask.quantity, usdValue: usd, side: 'ask', originalPrice: ask.price });
    }
  }
  
  // Анализируем значимые уровни
  for (const [groupPrice, data] of groupedLevels) {
    const ratio = data.usdValue / (avgQuantity * currentPrice);
    
    // Только значимые уровни (выше порога по USD)
    if (data.usdValue < minWallUsd) continue;
    
    const prevData = previousWalls.get(groupPrice);
    let status: Wall['status'] = 'stable';
    
    if (prevData) {
      const change = (data.usdValue - prevData.usdValue) / prevData.usdValue;
      if (change < -EATING_THRESHOLD) {
        status = 'declining'; // Стенку едят!
      } else if (change > EATING_THRESHOLD) {
        status = 'growing';
      }
    }
    
    walls.push({
      price: groupPrice,
      quantity: data.quantity,
      side: data.side,
      strength: ratio,
      status,
      previousQuantity: prevData?.quantity ?? data.quantity
    });
  }
  
  // Сортируем: сначала по USD стоимости (самые крупные сверху)
  walls.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
  
  // === СИГНАЛЫ ===
  
  // 1. Стенку ЕДЯТ (объём резко падает)
  for (const wall of walls) {
    if (wall.status !== 'declining') continue;
    
    const usdValue = wall.price * wall.quantity;
    const prevData = previousWalls.get(wall.price);
    if (!prevData) continue;
    
    const dropPct = ((prevData.usdValue - usdValue) / prevData.usdValue * 100).toFixed(0);
    const isWhale = usdValue >= minWallUsd * 5;
    const signalKey = `eating_${wall.side}_${wall.price}`;
    
    if (canEmitSignal(signalKey)) {
      const signal: Signal = {
        id: `eat_${now}_${wall.price}`,
        time: now,
        type: wall.side === 'ask' ? 'breakout_up' : 'breakout_down',
        price: wall.price,
        message: `🔥 ЕДЯТ ${wall.side === 'bid' ? 'ПОДДЕРЖКУ' : 'СОПРОТИВЛЕНИЕ'}! ${formatPrice(wall.price)} — объём упал на ${dropPct}% ($${formatUsd(usdValue)})`,
        strength: isWhale ? 'high' : 'medium'
      };
      state.addSignal(signal);
      playSignalSound(state.soundEnabled, signal.strength);
    }
  }
  
  // 2. Стенка ПОЛНОСТЬЮ съедена (была и пропала)
  for (const [price, prevData] of previousWalls) {
    if (prevData.usdValue < minWallUsd * 2) continue; // Только крупные
    
    const currentData = groupedLevels.get(price);
    const currentUsd = currentData?.usdValue ?? 0;
    
    // Если объём упал более чем на 80% — считаем что стенку съели
    if (currentUsd < prevData.usdValue * 0.2) {
      const isAbovePrice = price > currentPrice;
      const signalKey = `wall_eaten_${price}`;
      
      if (canEmitSignal(signalKey)) {
        const signal: Signal = {
          id: `eaten_${now}_${price}`,
          time: now,
          type: isAbovePrice ? 'breakout_up' : 'breakout_down',
          price,
          message: `⚡ СТЕНКА СЪЕДЕНА! ${formatPrice(price)} ($${formatUsd(prevData.usdValue)}) — путь ${isAbovePrice ? 'ВВЕРХ' : 'ВНИЗ'} открыт!`,
          strength: 'high'
        };
        state.addSignal(signal);
        playSignalSound(state.soundEnabled, 'high');
      }
    }
  }
  
  // 3. Новая КИТОВАЯ стенка появилась
  for (const wall of walls) {
    const usdValue = wall.price * wall.quantity;
    if (usdValue < minWallUsd * 10) continue; // Только киты (>$1M при minWallUsd=100K)
    
    const prevData = previousWalls.get(wall.price);
    // Если раньше не было или было значительно меньше
    if (!prevData || prevData.usdValue < usdValue * 0.5) {
      const signalKey = `whale_${wall.side}_${wall.price}`;
      
      if (canEmitSignal(signalKey)) {
        const signal: Signal = {
          id: `whale_${now}_${wall.price}`,
          time: now,
          type: wall.side === 'bid' ? 'bounce_up' : 'bounce_down',
          price: wall.price,
          message: `🐋 КИТ! ${wall.side === 'bid' ? 'Поддержка' : 'Сопротивление'} ${formatPrice(wall.price)} — $${formatUsd(usdValue)}`,
          strength: 'high'
        };
        state.addSignal(signal);
        playSignalSound(state.soundEnabled, 'high');
      }
    }
  }
  
  // Обновляем историю стенок
  previousWalls = new Map();
  for (const [price, data] of groupedLevels) {
    if (data.usdValue >= minWallUsd) {
      previousWalls.set(price, { quantity: data.quantity, usdValue: data.usdValue, timestamp: now });
    }
  }
  
  state.setWalls(walls);
}

// Форматирование для сообщений
function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

function formatUsd(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

function analyzeImpulse() {
  const state = useMarketStore.getState();
  const { trades, impulseTF, currentPrice, minWallUsd } = state;
  
  if (trades.length === 0) return;
  
  const now = Date.now();
  const tfMs = impulseTF * 60 * 1000;
  const currentSlot = Math.floor(now / tfMs) * tfMs;
  const candleTimeSec = Math.floor(currentSlot / 1000);
  
  const slotTrades = trades.filter(t => t.time >= currentSlot && t.time < currentSlot + tfMs);
  
  let buyVolume = 0;
  let sellVolume = 0;
  
  for (const trade of slotTrades) {
    const vol = trade.price * trade.quantity;
    if (trade.isBuyerMaker) {
      sellVolume += vol;
    } else {
      buyVolume += vol;
    }
  }
  
  const delta = buyVolume - sellVolume;
  
  const candle: ImpulseCandle = {
    time: candleTimeSec,
    buyVolume,
    sellVolume,
    totalTrades: slotTrades.length,
    delta
  };
  
  const existing = state.impulseCandles;
  const idx = existing.findIndex(c => c.time === candleTimeSec);
  if (idx >= 0) {
    const updated = [...existing];
    updated[idx] = candle;
    useMarketStore.setState({ impulseCandles: updated });
  } else {
    state.addImpulseCandle(candle);
  }
  
  if (currentSlot === lastImpulseCandleTime) return;
  
  const closedCandles = state.impulseCandles.filter(c => c.time < candleTimeSec);
  if (closedCandles.length < 3) {
    lastImpulseCandleTime = currentSlot;
    return;
  }
  
  const lastClosed = closedCandles[closedCandles.length - 1];
  const olderCandles = closedCandles.slice(-12, -1);
  
  if (olderCandles.length < 3) {
    lastImpulseCandleTime = currentSlot;
    return;
  }
  
  const avgTotal = olderCandles.reduce((s, c) => s + c.buyVolume + c.sellVolume, 0) / olderCandles.length;
  const closedTotal = lastClosed.buyVolume + lastClosed.sellVolume;
  const volumeRatio = avgTotal > 0 ? closedTotal / avgTotal : 0;
  const absDelta = Math.abs(lastClosed.delta);
  
  if (volumeRatio > 3 && closedTotal > minWallUsd && absDelta > minWallUsd * 0.2) {
    const isBullish = lastClosed.delta > 0;
    const signalKey = `impulse_${isBullish ? 'buy' : 'sell'}`;
    
    if (canEmitSignal(signalKey)) {
      const strength: Signal['strength'] = volumeRatio > 7 && closedTotal > minWallUsd * 3 ? 'high' : 'medium';
      const signal: Signal = {
        id: `imp_${Date.now()}`,
        time: Date.now(),
        type: isBullish ? 'impulse_buy' : 'impulse_sell',
        price: currentPrice,
        message: `🔥 Импульс ${isBullish ? 'ПОКУПОК' : 'ПРОДАЖ'} за ${impulseTF}м! $${formatUsd(closedTotal)} (${volumeRatio.toFixed(1)}x)`,
        strength
      };
      state.addSignal(signal);
      playSignalSound(state.soundEnabled, strength);
    }
  }
  
  lastImpulseCandleTime = currentSlot;
}

function playSignalSound(enabled: boolean, strength: 'low' | 'medium' | 'high') {
  if (!enabled || strength === 'low') return;
  
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (strength === 'high') {
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      // Двойной звук для важных сигналов
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      setTimeout(() => {
        try {
          const ctx2 = new AudioContext();
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.frequency.value = 1100;
          gain2.gain.value = 0.15;
          osc2.start();
          osc2.stop(ctx2.currentTime + 0.1);
          setTimeout(() => ctx2.close(), 200);
        } catch (_) {}
      }, 150);
    } else {
      osc.frequency.value = 660;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
    
    setTimeout(() => ctx.close(), 300);
  } catch (_e) {
    // Audio not available
  }
}
