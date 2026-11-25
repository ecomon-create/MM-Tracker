import { useMarketStore } from '../store/useMarketStore';

/**
 * Generate PineScript code for TradingView
 */
export function generatePineScript(): string {
  const state = useMarketStore.getState();
  const { walls, symbol, minWallUsd } = state;
  
  const bidWalls = walls.filter(w => w.side === 'bid').sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);
  const askWalls = walls.filter(w => w.side === 'ask').sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);
  
  const bidLines = bidWalls.map(w => {
    const usd = w.price * w.quantity;
    const width = usd > minWallUsd * 10 ? 4 : usd > minWallUsd * 3 ? 3 : 2;
    return `    line.new(bar_index - 100, ${w.price}, bar_index, ${w.price}, color=color.new(color.green, ${usd > minWallUsd * 10 ? '0' : '30'}), width=${width}, style=line.style_solid)`;
  }).join('\n');
  
  const askLines = askWalls.map(w => {
    const usd = w.price * w.quantity;
    const width = usd > minWallUsd * 10 ? 4 : usd > minWallUsd * 3 ? 3 : 2;
    return `    line.new(bar_index - 100, ${w.price}, bar_index, ${w.price}, color=color.new(color.red, ${usd > minWallUsd * 10 ? '0' : '30'}), width=${width}, style=line.style_solid)`;
  }).join('\n');

  return `//@version=5
indicator("MM Tracker — Стенки [${symbol}]", overlay=true, max_lines_count=500)

// ============================================================
// MM TRACKER — Уровни Маркет Мейкеров
// Сгенерировано: ${new Date().toLocaleString('ru-RU')}
// Пара: ${symbol}
// ============================================================

// --- Настройки ---
showVolDelta = input.bool(true, "Показывать Volume Delta")
impulseMultiplier = input.float(5.0, "Множитель импульсного объёма", minval=2.0, step=0.5)
lookback = input.int(20, "Период анализа", minval=5)

// --- Volume Delta ---
buyVol = close > open ? volume : (close == open ? volume / 2 : 0)
sellVol = close < open ? volume : (close == open ? volume / 2 : 0)
delta = buyVol - sellVol

// --- Импульсный объём ---
avgVol = ta.sma(volume, lookback)
isImpulse = volume > avgVol * impulseMultiplier
impulseBuy = isImpulse and close > open
impulseSell = isImpulse and close < open

// === ТЕКУЩИЕ СТЕНКИ ОТ MM TRACKER ===
${bidWalls.length > 0 ? `// 🟢 ПОДДЕРЖКА (BID):` : '// Стенки поддержки не обнаружены'}
${bidWalls.map(w => {
  const usd = w.price * w.quantity;
  const tier = usd > minWallUsd * 10 ? '🐋 КИТ' : usd > minWallUsd * 3 ? '⭐ Крупная' : '';
  return `// ${tier} ${w.price.toFixed(0)} | $${(usd/1000).toFixed(0)}K | ${w.status === 'declining' ? '📉 ЕДЯТ!' : w.status === 'growing' ? '📈 Растёт' : 'Стабильна'}`;
}).join('\n')}

${askWalls.length > 0 ? `// 🔴 СОПРОТИВЛЕНИЕ (ASK):` : '// Стенки сопротивления не обнаружены'}
${askWalls.map(w => {
  const usd = w.price * w.quantity;
  const tier = usd > minWallUsd * 10 ? '🐋 КИТ' : usd > minWallUsd * 3 ? '⭐ Крупная' : '';
  return `// ${tier} ${w.price.toFixed(0)} | $${(usd/1000).toFixed(0)}K | ${w.status === 'declining' ? '📉 ЕДЯТ!' : w.status === 'growing' ? '📈 Растёт' : 'Стабильна'}`;
}).join('\n')}

// --- Визуализация уровней ---
if barstate.islast
${bidLines || '    // Нет стенок поддержки'}
${askLines || '    // Нет стенок сопротивления'}

// Импульсные сигналы
plotshape(impulseBuy, style=shape.triangleup, location=location.belowbar, color=color.new(color.lime, 0), size=size.small, title="Импульс BUY")
plotshape(impulseSell, style=shape.triangledown, location=location.abovebar, color=color.new(color.red, 0), size=size.small, title="Импульс SELL")

// Volume Delta
plot(showVolDelta ? delta : na, style=plot.style_columns, color=delta > 0 ? color.new(color.green, 50) : color.new(color.red, 50), title="Delta")

// ============================================================
// RAVI — Range Action Verification Index (подтверждение тренда)
// ============================================================
ravi_fast1 = ta.sma(close, 1)
ravi_fast4 = ta.sma(close, 4)
ravi_slow  = ta.sma(close, 49)

ravi_1_49 = ravi_slow != 0 ? ((ravi_fast1 - ravi_slow) / ravi_slow) * 100 : 0
ravi_4_49 = ravi_slow != 0 ? ((ravi_fast4 - ravi_slow) / ravi_slow) * 100 : 0

// Пересечение RAVI → смена тренда
raviBullCross = ta.crossover(ravi_1_49, ravi_4_49)
raviBearCross = ta.crossunder(ravi_1_49, ravi_4_49)

plotshape(raviBullCross, style=shape.labelup, location=location.belowbar, color=color.new(color.lime, 0), size=size.normal, text="RAVI▲", title="RAVI BUY")
plotshape(raviBearCross, style=shape.labeldown, location=location.abovebar, color=color.new(color.red, 0), size=size.normal, text="RAVI▼", title="RAVI SELL")

// Алерты
alertcondition(impulseBuy, title="Импульс покупки", message="🔥 Импульс ПОКУПОК на {{ticker}}!")
alertcondition(impulseSell, title="Импульс продажи", message="🔥 Импульс ПРОДАЖ на {{ticker}}!")
alertcondition(raviBullCross, title="RAVI BUY", message="📐 RAVI: Тренд сменился на ВОСХОДЯЩИЙ на {{ticker}}!")
alertcondition(raviBearCross, title="RAVI SELL", message="📐 RAVI: Тренд сменился на НИСХОДЯЩИЙ на {{ticker}}!")
`;
}

/**
 * Generate MQL4 Custom Indicator code for MT4
 * Работает на любом инструменте — анализирует объёмы
 */
export function generateMQL4(): string {
  const state = useMarketStore.getState();
  const { walls, symbol, minWallUsd } = state;

  const bidWalls = walls.filter(w => w.side === 'bid').sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);
  const askWalls = walls.filter(w => w.side === 'ask').sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity)).slice(0, 5);

  // Формируем информацию об уровнях для комментария
  const wallsInfo = [
    '// ═══════════════════════════════════════════════════════════════',
    `// УРОВНИ ИЗ MM TRACKER (${symbol}) — ${new Date().toLocaleString('ru-RU')}`,
    '// ═══════════════════════════════════════════════════════════════',
    '//',
    '// 🟢 ПОДДЕРЖКА (покупатели):',
    ...bidWalls.map(w => {
      const usd = w.price * w.quantity;
      const tier = usd > minWallUsd * 10 ? '🐋' : usd > minWallUsd * 3 ? '⭐' : '  ';
      return `// ${tier} ${w.price.toFixed(0)} USDT | $${(usd/1000).toFixed(0)}K | ${w.status === 'declining' ? 'ЕДЯТ!' : w.status}`;
    }),
    '//',
    '// 🔴 СОПРОТИВЛЕНИЕ (продавцы):',
    ...askWalls.map(w => {
      const usd = w.price * w.quantity;
      const tier = usd > minWallUsd * 10 ? '🐋' : usd > minWallUsd * 3 ? '⭐' : '  ';
      return `// ${tier} ${w.price.toFixed(0)} USDT | $${(usd/1000).toFixed(0)}K | ${w.status === 'declining' ? 'ЕДЯТ!' : w.status}`;
    }),
    '//',
    '// ⚠️  Эти уровни для КРИПТО! Нанесите их вручную или используйте',
    '//     на графике криптовалюты в MT4/MT5 с соответствующим брокером.',
    '// ═══════════════════════════════════════════════════════════════',
  ].join('\n');

  return `//+------------------------------------------------------------------+
//|                   MM_Tracker_RAVI_Impulse.mq4                     |
//|        Импульсные объёмы + RAVI (1/49, 4/49) — смена тренда      |
//|        Сгенерировано: ${new Date().toLocaleString('ru-RU')}                              |
//+------------------------------------------------------------------+
#property copyright "MM Tracker"
#property link      "https://github.com/mmtracker"
#property version   "2.00"
#property strict

// Основной график — стрелки импульсов
#property indicator_chart_window

// Отдельное окно — RAVI
#property indicator_buffers 6
#property indicator_plots   6

// Буфер 0-1: Стрелки импульсов (на графике)
#property indicator_label1  "Impulse Buy"
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrLime
#property indicator_width1  3

#property indicator_label2  "Impulse Sell"
#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrRed
#property indicator_width2  3

// Буфер 2-3: RAVI линии (скрытые, данные для алертов)
#property indicator_label3  "RAVI 1/49"
#property indicator_type3   DRAW_NONE
#property indicator_color3  clrYellow

#property indicator_label4  "RAVI 4/49"
#property indicator_type4   DRAW_NONE
#property indicator_color4  clrDodgerBlue

// Буфер 4-5: Стрелки RAVI пересечений
#property indicator_label5  "RAVI Buy"
#property indicator_type5   DRAW_ARROW
#property indicator_color5  clrAqua
#property indicator_width5  2

#property indicator_label6  "RAVI Sell"
#property indicator_type6   DRAW_ARROW
#property indicator_color6  clrMagenta
#property indicator_width6  2

${wallsInfo}

//--- Входные параметры
input int    VolumePeriod      = 20;     // Период анализа объёма
input double ImpulseMultiplier = 5.0;    // Множитель (x от среднего)
input int    RAVI_Fast1        = 1;      // RAVI быстрый период 1
input int    RAVI_Fast2        = 4;      // RAVI быстрый период 2
input int    RAVI_Slow         = 49;     // RAVI медленный период
input bool   EnableAlerts      = true;   // Включить алерты
input int    AlertCooldownSec  = 300;    // Пауза между алертами (сек)
input bool   ShowLabels        = true;   // Показывать метки

//--- Буферы
double BuyBuffer[];
double SellBuffer[];
double Ravi1Buffer[];
double Ravi2Buffer[];
double RaviBuyBuffer[];
double RaviSellBuffer[];

//--- Глобальные
datetime lastAlertTime = 0;
datetime lastRaviAlertTime = 0;

//+------------------------------------------------------------------+
int init()
{
   SetIndexBuffer(0, BuyBuffer);
   SetIndexBuffer(1, SellBuffer);
   SetIndexBuffer(2, Ravi1Buffer);
   SetIndexBuffer(3, Ravi2Buffer);
   SetIndexBuffer(4, RaviBuyBuffer);
   SetIndexBuffer(5, RaviSellBuffer);
   
   SetIndexStyle(0, DRAW_ARROW); SetIndexArrow(0, 233);
   SetIndexStyle(1, DRAW_ARROW); SetIndexArrow(1, 234);
   SetIndexStyle(2, DRAW_NONE);
   SetIndexStyle(3, DRAW_NONE);
   SetIndexStyle(4, DRAW_ARROW); SetIndexArrow(4, 225); // Diamond up
   SetIndexStyle(5, DRAW_ARROW); SetIndexArrow(5, 226); // Diamond down
   
   SetIndexEmptyValue(0, EMPTY_VALUE);
   SetIndexEmptyValue(1, EMPTY_VALUE);
   SetIndexEmptyValue(2, EMPTY_VALUE);
   SetIndexEmptyValue(3, EMPTY_VALUE);
   SetIndexEmptyValue(4, EMPTY_VALUE);
   SetIndexEmptyValue(5, EMPTY_VALUE);
   
   IndicatorShortName("MM Tracker + RAVI");
   
   Print("MM Tracker: Импульсы ", ImpulseMultiplier, "x + RAVI(",
         RAVI_Fast1, "/", RAVI_Slow, " и ", RAVI_Fast2, "/", RAVI_Slow, ")");
   
   return(0);
}

//+------------------------------------------------------------------+
int deinit()
{
   for(int i = ObjectsTotal() - 1; i >= 0; i--)
   {
      string name = ObjectName(i);
      if(StringFind(name, "MM_") == 0)
         ObjectDelete(name);
   }
   return(0);
}

//+------------------------------------------------------------------+
int start()
{
   int counted_bars = IndicatorCounted();
   if(counted_bars < 0) return(-1);
   
   int limit = Bars - counted_bars;
   if(counted_bars > 0) limit++;
   if(limit > Bars - RAVI_Slow - 2) limit = Bars - RAVI_Slow - 2;
   if(limit < 1) limit = 1;
   
   for(int i = limit; i >= 0; i--)
   {
      BuyBuffer[i]     = EMPTY_VALUE;
      SellBuffer[i]    = EMPTY_VALUE;
      Ravi1Buffer[i]   = EMPTY_VALUE;
      Ravi2Buffer[i]   = EMPTY_VALUE;
      RaviBuyBuffer[i] = EMPTY_VALUE;
      RaviSellBuffer[i]= EMPTY_VALUE;
      
      // ═══ RAVI ═══
      double smaFast1 = iMA(NULL, 0, RAVI_Fast1, 0, MODE_SMA, PRICE_CLOSE, i);
      double smaFast2 = iMA(NULL, 0, RAVI_Fast2, 0, MODE_SMA, PRICE_CLOSE, i);
      double smaSlow  = iMA(NULL, 0, RAVI_Slow,  0, MODE_SMA, PRICE_CLOSE, i);
      
      if(smaSlow > 0)
      {
         Ravi1Buffer[i] = ((smaFast1 - smaSlow) / smaSlow) * 100.0;
         Ravi2Buffer[i] = ((smaFast2 - smaSlow) / smaSlow) * 100.0;
      }
      
      // Пересечение RAVI
      if(i < Bars - RAVI_Slow - 2)
      {
         double prevR1 = Ravi1Buffer[i + 1];
         double prevR2 = Ravi2Buffer[i + 1];
         double currR1 = Ravi1Buffer[i];
         double currR2 = Ravi2Buffer[i];
         
         if(prevR1 != EMPTY_VALUE && prevR2 != EMPTY_VALUE &&
            currR1 != EMPTY_VALUE && currR2 != EMPTY_VALUE)
         {
            double offset = (High[i] - Low[i]) * 0.8;
            
            // Быстрая пересекла медленную снизу вверх → BUY
            if(prevR1 <= prevR2 && currR1 > currR2)
            {
               RaviBuyBuffer[i] = Low[i] - offset;
               
               if(ShowLabels && i < 100)
               {
                  string lbl = "MM_RB_" + TimeToStr(Time[i]);
                  if(ObjectFind(lbl) < 0)
                  {
                     ObjectCreate(lbl, OBJ_TEXT, 0, Time[i], Low[i] - offset * 1.8);
                     ObjectSetText(lbl, "RAVI▲", 9, "Arial Bold", clrAqua);
                  }
               }
               
               if(EnableAlerts && i == 0 && (TimeCurrent() - lastRaviAlertTime >= AlertCooldownSec))
               {
                  Alert("📐 RAVI: Тренд ВОСХОДЯЩИЙ на ", Symbol());
                  lastRaviAlertTime = TimeCurrent();
               }
            }
            
            // Быстрая пересекла медленную сверху вниз → SELL
            if(prevR1 >= prevR2 && currR1 < currR2)
            {
               RaviSellBuffer[i] = High[i] + offset;
               
               if(ShowLabels && i < 100)
               {
                  string lbl = "MM_RS_" + TimeToStr(Time[i]);
                  if(ObjectFind(lbl) < 0)
                  {
                     ObjectCreate(lbl, OBJ_TEXT, 0, Time[i], High[i] + offset * 1.8);
                     ObjectSetText(lbl, "RAVI▼", 9, "Arial Bold", clrMagenta);
                  }
               }
               
               if(EnableAlerts && i == 0 && (TimeCurrent() - lastRaviAlertTime >= AlertCooldownSec))
               {
                  Alert("📐 RAVI: Тренд НИСХОДЯЩИЙ на ", Symbol());
                  lastRaviAlertTime = TimeCurrent();
               }
            }
         }
      }
      
      // ═══ ИМПУЛЬСНЫЕ ОБЪЁМЫ ═══
      if(i + VolumePeriod < Bars)
      {
         double avgVol = 0;
         for(int j = 1; j <= VolumePeriod; j++)
            avgVol += (double)Volume[i + j];
         avgVol /= VolumePeriod;
         
         if(avgVol > 0)
         {
            double ratio = (double)Volume[i] / avgVol;
            
            if(ratio >= ImpulseMultiplier)
            {
               double offset = (High[i] - Low[i]) * 0.5;
               
               if(Close[i] > Open[i])
               {
                  BuyBuffer[i] = Low[i] - offset;
                  if(ShowLabels && i < 50)
                  {
                     string lbl = "MM_IB_" + TimeToStr(Time[i]);
                     if(ObjectFind(lbl) < 0)
                     {
                        ObjectCreate(lbl, OBJ_TEXT, 0, Time[i], Low[i] - offset * 1.5);
                        ObjectSetText(lbl, DoubleToStr(ratio, 1) + "x", 8, "Arial", clrLime);
                     }
                  }
                  if(EnableAlerts && i == 0 && (TimeCurrent() - lastAlertTime >= AlertCooldownSec))
                  {
                     Alert("🔥 Импульс ПОКУПКИ на ", Symbol(), " | ", DoubleToStr(ratio, 1), "x");
                     lastAlertTime = TimeCurrent();
                  }
               }
               else if(Close[i] < Open[i])
               {
                  SellBuffer[i] = High[i] + offset;
                  if(ShowLabels && i < 50)
                  {
                     string lbl = "MM_IS_" + TimeToStr(Time[i]);
                     if(ObjectFind(lbl) < 0)
                     {
                        ObjectCreate(lbl, OBJ_TEXT, 0, Time[i], High[i] + offset * 1.5);
                        ObjectSetText(lbl, DoubleToStr(ratio, 1) + "x", 8, "Arial", clrRed);
                     }
                  }
                  if(EnableAlerts && i == 0 && (TimeCurrent() - lastAlertTime >= AlertCooldownSec))
                  {
                     Alert("🔥 Импульс ПРОДАЖИ на ", Symbol(), " | ", DoubleToStr(ratio, 1), "x");
                     lastAlertTime = TimeCurrent();
                  }
               }
            }
         }
      }
   }
   
   return(0);
}
//+------------------------------------------------------------------+
`;
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
