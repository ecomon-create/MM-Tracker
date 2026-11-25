interface HelpPanelProps {
  onClose: () => void;
}

export default function HelpPanel({ onClose }: HelpPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-white">📖 Руководство пользователя</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl px-2">✕</button>
        </div>
        
        <div className="p-6 space-y-8 text-sm">
          {/* What is this */}
          <section>
            <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              🏦 Что такое MM Tracker?
            </h3>
            <p className="text-gray-300 leading-relaxed mb-3">
              <strong>MM Tracker</strong> — это анализатор активности Маркет Мейкеров (крупных игроков) на криптовалютных рынках. 
              В отличие от обычных индикаторов, которые показывают прошлое, MM Tracker показывает <em>намерения</em> крупных участников рынка.
            </p>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs">
              💡 <strong>Ключевая идея:</strong> Маркет Мейкеры оставляют "следы" в стакане ордеров — крупные лимитные ордера (стенки). 
              Перед движением цены они снимают эти ордера. Мы отслеживаем эти действия в реальном времени.
            </div>
          </section>

          {/* Walls explanation */}
          <section>
            <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              🧱 Что такое "стенки"?
            </h3>
            <p className="text-gray-300 leading-relaxed mb-3">
              Стенки — это уровни в стакане ордеров, где объём значительно превышает средний (в 3+ раз по умолчанию).
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-green-400 font-bold mb-1">🟢 Стенка поддержки (BID)</div>
                <div className="text-gray-400 text-xs">Крупный ордер на покупку. Может удержать цену от падения или быть "ловушкой" перед пробоем вниз.</div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-bold mb-1">🔴 Стенка сопротивления (ASK)</div>
                <div className="text-gray-400 text-xs">Крупный ордер на продажу. Может не пустить цену вверх или быть "ловушкой" перед пробоем вверх.</div>
              </div>
            </div>
            
            <h4 className="font-bold text-gray-200 mb-2">Статусы стенок:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                <span className="text-lg">📈</span>
                <div>
                  <span className="font-bold text-green-400">Растёт</span>
                  <span className="text-gray-400 text-xs ml-2">— ММ усиливает позицию, вероятен отскок от уровня</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                <span className="text-lg">📉</span>
                <div>
                  <span className="font-bold text-yellow-400">Снижается</span>
                  <span className="text-gray-400 text-xs ml-2">— ⚠️ ММ снимает ордер, возможен пробой!</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                <span className="text-lg">➖</span>
                <div>
                  <span className="font-bold text-gray-300">Стабильна</span>
                  <span className="text-gray-400 text-xs ml-2">— нейтрально, продолжаем наблюдение</span>
                </div>
              </div>
            </div>
          </section>

          {/* Impulse volumes */}
          <section>
            <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
              🔥 Импульсные объёмы
            </h3>
            <p className="text-gray-300 leading-relaxed mb-3">
              Импульсные объёмы — это всплески маркет-ордеров (рыночных покупок или продаж), которые показывают реальное давление на цену.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded bg-gray-800/50 text-center">
                <div className="text-green-400 font-bold">Покупки</div>
                <div className="text-gray-500 text-xs">Объём маркет-ордеров на покупку</div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 text-center">
                <div className="text-red-400 font-bold">Продажи</div>
                <div className="text-gray-500 text-xs">Объём маркет-ордеров на продажу</div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 text-center">
                <div className="text-blue-400 font-bold">Дельта</div>
                <div className="text-gray-500 text-xs">Разница: покупки − продажи</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs">
              ⚡ <strong>Сигнал:</strong> Если объём за последние секунды превышает средний в 3+ раз — это импульсный сигнал. 
              Положительная дельта = бычий импульс, отрицательная = медвежий.
            </div>
          </section>

          {/* Signals */}
          <section>
            <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
              📡 Типы сигналов
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">🚀</span>
                <div>
                  <div className="font-bold text-green-400">Прорыв ↑</div>
                  <div className="text-gray-500 text-xs">Стенка сопротивления убрана — путь вверх открыт</div>
                </div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">💥</span>
                <div>
                  <div className="font-bold text-red-400">Прорыв ↓</div>
                  <div className="text-gray-500 text-xs">Стенка поддержки убрана — путь вниз открыт</div>
                </div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">⬆️</span>
                <div>
                  <div className="font-bold text-green-400">Отскок ↑</div>
                  <div className="text-gray-500 text-xs">Стенка поддержки усиливается — ожидается рост</div>
                </div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">⬇️</span>
                <div>
                  <div className="font-bold text-red-400">Отскок ↓</div>
                  <div className="text-gray-500 text-xs">Стенка сопротивления усиливается — ожидается падение</div>
                </div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">🟢</span>
                <div>
                  <div className="font-bold text-green-400">Импульс BUY</div>
                  <div className="text-gray-500 text-xs">Всплеск покупок — бычье давление</div>
                </div>
              </div>
              <div className="p-2 rounded bg-gray-800/50 flex items-start gap-2">
                <span className="text-lg">🔴</span>
                <div>
                  <div className="font-bold text-red-400">Импульс SELL</div>
                  <div className="text-gray-500 text-xs">Всплеск продаж — медвежье давление</div>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 rounded bg-gray-800/50 text-xs">
              <strong className="text-gray-200">Сила сигнала:</strong>
              <span className="ml-2 text-red-400">🔥 Сильный</span> — немедленное внимание |
              <span className="ml-2 text-yellow-400">⚡ Средний</span> — учитывать |
              <span className="ml-2 text-blue-400">💡 Слабый</span> — информационный
            </div>
          </section>

          {/* Trading strategies */}
          <section>
            <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
              🎯 Как торговать
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-800/50 border-l-4 border-green-500">
                <div className="font-bold text-green-400 mb-1">Стратегия "Ловушка ММ"</div>
                <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Найдите сильную стенку (5x+)</li>
                  <li>Дождитесь статуса "📉 Снижается"</li>
                  <li>Готовьтесь к входу в сторону пробоя</li>
                  <li>Подтверждение: импульсный объём + исчезновение стенки</li>
                </ol>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50 border-l-4 border-blue-500">
                <div className="font-bold text-blue-400 mb-1">Стратегия "Отскок"</div>
                <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Найдите стенку со статусом "📈 Растёт"</li>
                  <li>Дождитесь подхода цены к уровню</li>
                  <li>Проверьте дисбаланс (должен быть в сторону стенки)</li>
                  <li>Вход на отскок, стоп за уровнем стенки</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Export */}
          <section>
            <h3 className="text-lg font-bold text-orange-400 mb-3 flex items-center gap-2">
              📤 Экспорт в TradingView / MT4
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gray-800/50">
                <div className="font-bold text-blue-400 mb-2">📊 TradingView</div>
                <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Откройте Настройки (⚙️)</li>
                  <li>Нажмите "Скачать .pine"</li>
                  <li>В TradingView: Pine Editor → вставить код</li>
                  <li>Нажмите "Add to Chart"</li>
                </ol>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50">
                <div className="font-bold text-amber-400 mb-2">🏦 MetaTrader 4</div>
                <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                  <li>Откройте Настройки (⚙️)</li>
                  <li>Нажмите "Скачать .mq4"</li>
                  <li>Скопируйте в MQL4/Indicators/</li>
                  <li>Перезапустите MT4, добавьте индикатор</li>
                </ol>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs">
              ⚠️ <strong>Важно:</strong> Экспортированные уровни актуальны на момент генерации. 
              ММ постоянно перемещают ордера — регулярно обновляйте индикатор (каждые 15-30 минут).
            </div>
          </section>

          {/* Entry rules */}
          <section>
            <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
              ✅ Правила входа в сделку
            </h3>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
              <div className="font-bold text-white mb-2">🔥 Когда входить в BUY:</div>
              <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                <li>Есть стенка сопротивления &gt;$500K (или 🐋)</li>
                <li>Появился сигнал "📉 ЕДЯТ СОПРОТИВЛЕНИЕ"</li>
                <li>Объём на стенке упал более чем на 30%</li>
                <li>Импульс покупок (зелёная дельта)</li>
                <li><strong>Свеча H1 закрылась ВЫШЕ уровня стенки</strong></li>
              </ol>
              <div className="mt-2 text-[10px] text-green-300">
                Стоп: под съеденной стенкой | Тейк: следующее сопротивление
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
              <div className="font-bold text-white mb-2">🔥 Когда входить в SELL:</div>
              <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                <li>Есть стенка поддержки &gt;$500K (или 🐋)</li>
                <li>Появился сигнал "📉 ЕДЯТ ПОДДЕРЖКУ"</li>
                <li>Объём на стенке упал более чем на 30%</li>
                <li>Импульс продаж (красная дельта)</li>
                <li><strong>Свеча H1 закрылась НИЖЕ уровня стенки</strong></li>
              </ol>
              <div className="mt-2 text-[10px] text-red-300">
                Стоп: над съеденной стенкой | Тейк: следующая поддержка
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="font-bold text-yellow-400 mb-2">⚠️ Чек-лист перед входом:</div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300">
                <div>□ Крупная стенка (&gt;$500K)?</div>
                <div>□ Стенку едят (сигнал)?</div>
                <div>□ Объём упал &gt;30%?</div>
                <div>□ Импульс в нужную сторону?</div>
                <div>□ Свеча H1 подтвердила?</div>
                <div>□ Знаю стоп и тейк?</div>
                <div>□ R:R минимум 1:2?</div>
                <div>□ Риск ≤1% депозита?</div>
              </div>
              <div className="mt-2 text-yellow-400 font-bold text-xs">
                Если хоть один пункт = НЕТ → НЕ ВХОДИМ!
              </div>
            </div>
          </section>

          {/* Risk warning */}
          <section>
            <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
              ❌ Когда НЕ входить
            </h3>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs space-y-2">
              <p>• <strong>Стенка только появилась</strong> — ждите что будет дальше</p>
              <p>• <strong>Нет импульса</strong> — дельта около нуля, рынок спит</p>
              <p>• <strong>Свеча не подтвердила</strong> — не закрылась за уровнем</p>
              <p>• <strong>Скоро новости</strong> — стенки могут быть ловушкой</p>
              <p>• <strong>Маленький стоп</strong> — лучше пропустить, чем поймать стоп</p>
              <p>• <strong>После 3 убытков</strong> — стоп на сегодня, анализ ошибок</p>
            </div>
          </section>

          {/* Quick reference */}
          <section>
            <h3 className="text-lg font-bold text-gray-300 mb-3">📋 Краткая справка</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-green-500/10 text-center">
                <div className="text-lg mb-1">🟢</div>
                <div className="text-green-400">BID / Покупка</div>
              </div>
              <div className="p-2 rounded bg-red-500/10 text-center">
                <div className="text-lg mb-1">🔴</div>
                <div className="text-red-400">ASK / Продажа</div>
              </div>
              <div className="p-2 rounded bg-yellow-500/10 text-center">
                <div className="text-lg mb-1">🧱</div>
                <div className="text-yellow-400">Стенка</div>
              </div>
              <div className="p-2 rounded bg-blue-500/10 text-center">
                <div className="text-lg mb-1">🐋</div>
                <div className="text-blue-400">Крупная сделка</div>
              </div>
            </div>
          </section>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-center text-gray-500 text-xs">
          MM Tracker v1.0 • Торгуйте вместе с Маркет Мейкерами, а не против них
        </div>
      </div>
    </div>
  );
}
