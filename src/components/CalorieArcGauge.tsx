'use client';

import { Zap } from 'lucide-react';

interface CalorieArcGaugeProps {
  consumed: number;
  target: number;
}

// 18 dots spread across a 180° arc matching the reference minimalist design
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
            r={5.5}
            fill={dot.filled ? (isOver ? '#DC2626' : '#B45309') : '#E7E3D8'}
            className="animate-pop-in origin-center transition-colors duration-500"
            style={{
              animationDelay: `${i * 30}ms`,
              animationFillMode: 'both',
            }}
          />
        ))}
      </svg>

      {/* Centre content with micro-bounce entrance */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center text-center pb-1 animate-scale-in">
        <div className="w-9 h-9 rounded-full bg-[#FFF7ED] border border-[#FED7AA]/50 flex items-center justify-center text-[#B45309] mb-1.5 shadow-sm">
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C827A]">
          CONSUMED
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display text-[38px] leading-none font-bold text-[#1C1917] tracking-tight">
            {Math.round(consumed).toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-[#8C827A]">kcal</span>
        </div>
      </div>
    </div>
  );
}