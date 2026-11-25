'use client';

import { Zap } from 'lucide-react';

interface CalorieArcGaugeProps {
  consumed: number;
  target: number;
}

// 18 dots spread across a 180° arc (like the design)
const DOT_COUNT = 18;

export function CalorieArcGauge({ consumed, target }: CalorieArcGaugeProps) {
  const safeTarget = Math.max(1, target);
  const ratio = Math.min(1, Math.max(0, consumed / safeTarget));
  const filledCount = consumed === 0 ? 0 : Math.max(1, Math.round(ratio * DOT_COUNT));
  const remaining = Math.round(safeTarget - consumed);
  const isOver = remaining < 0;

  // Arc: half circle from left (200°) to right (340°) going up and over
  // cx=120, cy=130, r=90
  const cx = 120, cy = 130, r = 90;
  const startAngle = 200; // degrees
  const endAngle = 340;
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const angle = startAngle + ((endAngle - startAngle) / (DOT_COUNT - 1)) * i;
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      filled: i < filledCount,
    };
  });

  return (
    <div className="relative w-full max-w-[260px] h-[150px] flex items-end justify-center mx-auto">
      <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 240 140">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={6}
            fill={dot.filled ? (isOver ? '#DC2626' : '#B45309') : '#D6D0C4'}
            className="transition-all duration-500"
          />
        ))}
      </svg>

      {/* Centre content */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center text-center pb-1">
        <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#B45309] mb-1">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#6B5F4E]">
          CONSUMED
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[36px] leading-none font-bold text-[#1a1a1a] tracking-tight">
            {Math.round(consumed).toLocaleString()}
          </span>
          <span className="text-sm font-medium text-[#6B5F4E]">kcal</span>
        </div>
      </div>
    </div>
  );
}
