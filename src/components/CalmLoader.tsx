'use client';

import { useEffect, useRef, useState } from 'react';

interface CalmLoaderProps {
  size?: number;
  text?: string;
  className?: string;
}

/**
 * Calm, meditative loading animation
 * Soft blue blurred orbs orbiting in a gentle circle
 * No harsh spinners, no sharp edges - pure tranquility
 */
export function CalmLoader({ 
  size = 80, 
  text = 'Analyzing Meal…', 
  className = '' 
}: CalmLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Reduced motion support
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!mounted) {
    // SSR fallback - minimal static representation
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
        <div className="relative" style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[60px]" />
          <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500/20 blur-[30px]" />
        </div>
        <span className="text-sm font-medium text-white/70">{text}</span>
      </div>
    );
  }

  // Calm animation using CSS custom properties for smooth GPU-accelerated motion
  const orbitStyle = {
    '--orbit-duration': '8s',
    '--orbit-radius': `${size * 0.35}px`,
    '--orb-size': `${size * 0.18}px`,
    '--blur-radius': `${size * 0.15}px`,
  } as React.CSSProperties;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status" 
      aria-live="polite"
      aria-label={text}
      style={{ width: size, height: size + 40 }}
    >
      <div 
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {/* Ambient glow layers - static, soft background atmosphere */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/5 blur-[80px]" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/8 via-transparent to-cyan-500/3 blur-[60px]" />
        
        {/* Subtle center pulse - the "heart" of the animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-blue-500/15 blur-[40px] animate-[pulse_4s_ease-in-out_infinite]" />

        {/* Orbiting orbs - 3 orbs at 120° offsets, blurred and gentle */}
        <div 
          className="absolute inset-0"
          style={{
            animation: prefersReducedMotion ? 'none' : 'orbit 8s linear infinite',
            transformOrigin: 'center center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/60 to-cyan-400/40 blur-[30px] mix-blend-plus"
              style={{
                width: 'var(--orb-size)',
                height: 'var(--orb-size)',
                transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(var(--orbit-radius))`,
                filter: 'blur(var(--blur-radius))',
                opacity: 0.7,
                willChange: 'transform',
              }}
            />
          ))}
        </div>

        {/* Secondary orbit - opposite direction, smaller orbs, more subtle */}
        <div 
          className="absolute inset-0"
          style={{
            animation: prefersReducedMotion ? 'none' : 'orbit-reverse 12s linear infinite',
            transformOrigin: 'center center',
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-cyan-300/40 to-blue-300/20 blur-[20px] mix-blend-plus"
              style={{
                width: 'calc(var(--orb-size) * 0.6)',
                height: 'calc(var(--orb-size) * 0.6)',
                transform: `translate(-50%, -50%) rotate(${i * 180 + 60}deg) translateX(calc(var(--orbit-radius) * 0.7))`,
                filter: 'blur(calc(var(--blur-radius) * 0.7))',
                opacity: 0.5,
                willChange: 'transform',
              }}
            />
          ))}
        </div>

        {/* Tertiary micro-orbs - tiny sparkles */}
        <div 
          className="absolute inset-0"
          style={{
            animation: prefersReducedMotion ? 'none' : 'orbit 20s linear infinite reverse',
            transformOrigin: 'center center',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[10px]"
              style={{
                width: 'calc(var(--orb-size) * 0.35)',
                height: 'calc(var(--orb-size) * 0.35)',
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateX(calc(var(--orbit-radius) * 1.15))`,
                filter: 'blur(calc(var(--blur-radius) * 0.5))',
                opacity: 0.4,
                willChange: 'transform',
              }}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>

      <span className="text-sm font-medium text-white/70 tracking-wide">
        {text}
      </span>
    </div>
  );
}

/**
 * Compact version for the capture button
 */
export function CalmLoaderCompact({ 
  size = 56, 
  className = '' 
}: { size?: number; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-[40px]" />
        <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-[60px]" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-500/8 blur-[50px]" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-transparent to-cyan-500/5 blur-[35px]" />
      
      {/* Center pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/5 h-2/5 rounded-full bg-blue-500/20 blur-[25px] animate-[pulse_3s_ease-in-out_infinite]" />

      {/* Single orbit with 3 orbs */}
      <div 
        className="absolute inset-0"
        style={{
          animation: prefersReducedMotion ? 'none' : 'orbit 6s linear infinite',
          transformOrigin: 'center center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400/70 to-cyan-400/50 blur-[20px] mix-blend-plus"
            style={{
              width: `${size * 0.16}px`,
              height: `${size * 0.16}px`,
              transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${size * 0.3}px)`,
              filter: `blur(${size * 0.1}px)`,
              opacity: 0.8,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <style jsx global>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.25); }
        }
      `}</style>
    </div>
  );
}