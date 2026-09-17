import React, { useState } from 'react';
import { DollarSign, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';

interface ExchangeRateBarProps {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

export const ExchangeRateBar: React.FC<ExchangeRateBarProps> = ({
  exchangeRate,
  setExchangeRate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customVal, setCustomVal] = useState(exchangeRate.toString());

  const presets = [920, 940, 960, 980];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customVal);
    if (!isNaN(parsed) && parsed > 500 && parsed < 2000) {
      setExchangeRate(parsed);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-stone-900 text-stone-100 px-4 py-3 border-b border-stone-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Tipo de cambio de referencia:</span>{' '}
            <span className="text-amber-300 font-mono font-bold">USD 1 ≈ CLP {exchangeRate}</span>{' '}
            <span className="text-stone-400 text-xs hidden md:inline">
              (Dólar observado Banco Central de Chile — Septiembre 2026)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-400 text-xs hidden sm:inline">Ajustar al valor del día:</span>
          <div className="flex items-center gap-1">
            {presets.map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setExchangeRate(rate);
                  setCustomVal(rate.toString());
                }}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  exchangeRate === rate
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                ${rate}
              </button>
            ))}
          </div>

          {isEditing ? (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-1">
              <input
                type="number"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded bg-stone-800 border border-stone-600 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                min="600"
                max="1500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-0.5 rounded bg-amber-400 text-stone-900 text-xs font-semibold"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-stone-200 text-xs px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-amber-300 hover:text-amber-200 underline underline-offset-2 ml-1"
            >
              Personalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
