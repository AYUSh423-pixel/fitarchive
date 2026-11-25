'use client';

import { useEffect, useState } from 'react';

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

  // Reduced motion support
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR fallback - minimal static representation
    return (
      <div className={`calm-loader flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite" style={{ '--loader-size': `${size}px` }}>
        <div className="calm-loader__orbits" style={{ width: size, height: size }}>
          <div className="calm-loader__glow calm-loader__glow--1" />
          <div className="calm-loader__glow calm-loader__glow--2" />
          <div className="calm-loader__center-pulse" />
          <div className="calm-loader__orbit calm-loader__orbit--1">
            <div className="calm-loader__orb" style={{ '--orb-index': '0' }} />
            <div className="calm-loader__orb" style={{ '--orb-index': '1' }} />
            <div className="calm-loader__orb" style={{ '--orb-index': '2' }} />
          </div>
          <div className="calm-loader__orbit calm-loader__orbit--2">
            <div className="calm-loader__orb calm-loader__orb--small" style={{ '--orb-index': '0' }} />
            <div className="calm-loader__orb calm-loader__orb--small" style={{ '--orb-index': '1' }} />
          </div>
          <div className="calm-loader__orbit calm-loader__orbit--3">
            <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '0' }} />
            <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '1' }} />
            <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '2' }} />
            <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '3' }} />
          </div>
        </div>
        <span className="calm-loader__text">{text}</span>
      </div>
    );
  }

  return (
    <div className={`calm-loader flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite" aria-label={text} style={{ '--loader-size': `${size}px` }}>
      <div className="calm-loader__orbits" style={{ width: size, height: size }} aria-hidden="true">
        {/* Ambient glow layers - static, soft background atmosphere */}
        <div className="calm-loader__glow calm-loader__glow--1" />
        <div className="calm-loader__glow calm-loader__glow--2" />
        
        {/* Subtle center pulse - the "heart" of the animation */}
        <div className="calm-loader__center-pulse" />

        {/* Orbiting orbs - 3 orbs at 120° offsets, blurred and gentle */}
        <div className={`calm-loader__orbit calm-loader__orbit--1 ${prefersReducedMotion ? 'calm-loader__orbit--static' : ''}`}>
          <div className="calm-loader__orb" style={{ '--orb-index': '0' }} />
          <div className="calm-loader__orb" style={{ '--orb-index': '1' }} />
          <div className="calm-loader__orb" style={{ '--orb-index': '2' }} />
        </div>

        {/* Secondary orbit - opposite direction, smaller orbs, more subtle */}
        <div className={`calm-loader__orbit calm-loader__orbit--2 ${prefersReducedMotion ? 'calm-loader__orbit--static' : ''}`}>
          <div className="calm-loader__orb calm-loader__orb--small" style={{ '--orb-index': '0' }} />
          <div className="calm-loader__orb calm-loader__orb--small" style={{ '--orb-index': '1' }} />
        </div>

        {/* Tertiary micro-orbs - tiny sparkles */}
        <div className={`calm-loader__orbit calm-loader__orbit--3 ${prefersReducedMotion ? 'calm-loader__orbit--static' : ''}`}>
          <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '0' }} />
          <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '1' }} />
          <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '2' }} />
          <div className="calm-loader__orb calm-loader__orb--micro" style={{ '--orb-index': '3' }} />
        </div>
      </div>

      <span className="calm-loader__text">{text}</span>
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
      <div className={`calm-loader-compact ${className}`} style={{ width: size, height: size, '--loader-size': `${size}px` }} aria-hidden="true">
        <div className="calm-loader-compact__glow calm-loader-compact__glow--1" />
        <div className="calm-loader-compact__glow calm-loader-compact__glow--2" />
      </div>
    );
  }

  return (
    <div className={`calm-loader-compact ${className}`} style={{ width: size, height: size, '--loader-size': `${size}px` }} aria-hidden="true">
      {/* Ambient glow */}
      <div className="calm-loader-compact__glow calm-loader-compact__glow--1" />
      <div className="calm-loader-compact__glow calm-loader-compact__glow--2" />
      
      {/* Center pulse */}
      <div className="calm-loader-compact__center-pulse" />

      {/* Single orbit with 3 orbs */}
      <div className={`calm-loader-compact__orbit ${prefersReducedMotion ? 'calm-loader-compact__orbit--static' : ''}`}>
        <div className="calm-loader-compact__orb" style={{ '--orb-index': '0' }} />
        <div className="calm-loader-compact__orb" style={{ '--orb-index': '1' }} />
        <div className="calm-loader-compact__orb" style={{ '--orb-index': '2' }} />
      </div>
    </div>
  );
}