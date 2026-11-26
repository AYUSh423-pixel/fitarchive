'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-[#e8e4d0] overflow-hidden';

  const variantStyles = {
    text: 'h-3 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const widthStyle = width ? { width: typeof width === 'number' ? `${width}px` : width } : {};
  const heightStyle = height ? { height: typeof height === 'number' ? `${height}px` : height } : {};

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
      style={{ ...widthStyle, ...heightStyle }}
      {...props}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '', ...props }: { lines?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%' } />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '', ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-3xl bg-white shadow-warm p-5 space-y-4', className)} {...props}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={160} />
      <div className="flex gap-2">
        <Skeleton variant="rounded" width="30%" height={36} />
        <Skeleton variant="rounded" width="30%" height={36} />
        <Skeleton variant="rounded" width="30%" height={36} />
      </div>
    </div>
  );
}

export function SkeletonMealCard({ className = '', ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-3xl bg-white shadow-warm p-5 space-y-3', className)} {...props}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Skeleton variant="text" width="40px" height={10} />
          <Skeleton variant="text" width="60%" height={20} />
        </div>
        <Skeleton variant="rounded" width={100} height={24} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton variant="text" width="70%" height={12} />
        <Skeleton variant="rounded" width={90} height={32} />
      </div>
    </div>
  );
}

export function SkeletonRecipeCard({ className = '', ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-3xl bg-white shadow-warm p-6 space-y-5', className)} {...props}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="60%" height={28} />
        </div>
      </div>
      <Skeleton variant="text" lines={2} />
      <div className="flex flex-wrap gap-2">
        <Skeleton variant="rounded" width={120} height={28} />
        <Skeleton variant="rounded" width={140} height={28} />
      </div>
      <div className="space-y-2 pt-2 border-t border-[#f0ece0]">
        <div className="flex items-baseline justify-between">
          <Skeleton variant="text" width="80px" />
          <div className="text-right">
            <Skeleton variant="text" width="80px" height={32} />
            <Skeleton variant="text" width="60px" height={12} />
          </div>
        </div>
        <Skeleton variant="rectangular" height={10} />
        <div className="flex justify-between">
          <Skeleton variant="text" width="50px" height={10} />
          <Skeleton variant="text" width="50px" height={10} />
          <Skeleton variant="text" width="50px" height={10} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="60px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
        </div>
      </div>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rectangular" height={50} width="100%" />
    </div>
  );
}

export default Skeleton;