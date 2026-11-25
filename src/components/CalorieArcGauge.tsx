'use client';

import { Zap } from 'lucide-react';

interface CalorieArcGaugeProps {
  consumed: number;
  target: number;
}

const SEGMENTS = [
  'M 24 125 A 96 96 0 0 1 31 92',
  'M 39 77 A 96 96 0 0 1 59 49',
  'M 72 38 A 96 96 0 0 1 101 25',
  'M 117 23 A 96 96 0 0 1 149 27',
  'M 164 34 A 96 96 0 0 1 190 55',
  'M 201 69 A 96 96 0 0 1 213 97',
  'M 216 110 A 96 96 0 0 1 217 125',
];

export function CalorieArcGauge({ consumed, target }: CalorieArcGaugeProps) {
  const safeTarget = Math.max(1, target);
  const ratio = Math.min(1, Math.max(0, consumed / safeTarget));
  const filledCount = consumed === 0 ? 0 : Math.max(1, Math.round(ratio * SEGMENTS.length));
  const remaining = Math.round(safeTarget - consumed);
  const isOver = remaining < 0;

  return (
    <div className="relative w-full max-w-[290px] h-[156px] flex items-end justify-center mx-auto">
      <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 240 135">
        {SEGMENTS.map((d, idx) => {
          const isFilled = idx < filledCount;
          const stroke = isFilled ? (isOver ? '#BA1A1A' : '#FB923C') : '#F0EDF1';
          return (
            <path
              key={idx}
              d={d}
              stroke={stroke}
              strokeLinecap="round"
              strokeWidth="16"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      <div className="absolute bottom-1 inset-x-0 flex flex-col items-center text-center">
        <div className="w-8 h-8 rounded-full bg-[#FFDDCC]/70 flex items-center justify-center text-[#944A00] mb-1">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#554337]">
          Consumed
        </span>
        <div className="flex items-baseline justify-center gap-1 mt-0.5">
          <span className="font-display text-[32px] leading-none font-bold text-[#1B1B1E] tracking-tight">
            {Math.round(consumed).toLocaleString()}
          </span>
          <span className="text-sm font-medium text-[#554337]">kcal</span>
        </div>
        <span className={`text-xs font-semibold mt-1 ${isOver ? 'text-[#BA1A1A]' : 'text-[#944A00]'}`}>
          Target: {safeTarget.toLocaleString()} kcal •{' '}
          {isOver ? `${Math.abs(remaining)} over` : `${remaining.toLocaleString()} left`}
        </span>
      </div>
    </div>
  );
}
