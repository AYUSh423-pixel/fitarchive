'use client';

import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  striped = false,
  className = '',
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantStyles = {
    default: 'bg-linear-to-r from-[#c05800] to-[#713600]',
    primary: 'bg-[#713600]',
    secondary: 'bg-[#c05800]',
    success: 'bg-[#16a34a]',
    warning: 'bg-[#f59e0b]',
    error: 'bg-[#dc2626]',
  };

  return (
    <div className={`w-full ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#38240d]">{label || `${Math.round(percentage)}%`}</span>
          {showLabel && <span className="text-xs font-bold text-[#713600]">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={`
          w-full rounded-full bg-[#e8e4d0] overflow-hidden
          ${sizeStyles[size]}
          ${animated ? 'animate-pulse' : ''}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            ${variantStyles[variant]}
            ${striped ? 'bg-stripes animate-stripes' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  label,
  children,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'url(#gradient-default)',
    primary: '#713600',
    secondary: '#c05800',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="gradient-default" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c05800" />
            <stop offset="100%" stopColor="#713600" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8e4d0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variantColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: variant === 'default' ? 'drop-shadow(0 2px 4px rgba(192, 88, 0, 0.3))' : 'none' }}
        />
      </svg>
      {(showLabel || label || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <div className="text-center">
              {showLabel && (
                <span className="font-display font-bold text-[#38240d]" style={{ fontSize: size * 0.18 }}>
                  {label || `${Math.round(percentage)}%`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Array<{ label: string; description?: string; icon?: React.ReactNode }>;
  currentStep: number;
  variant?: 'default' | 'primary';
  orientation?: 'horizontal' | 'vertical';
}

export function StepProgress({
  steps,
  currentStep,
  variant = 'default',
  orientation = 'horizontal',
  className = '',
  ...props
}: StepProgressProps) {
  const activeColor = variant === 'primary' ? '#713600' : '#c05800';
  const inactiveColor = '#e8e4d0';

  return (
    <div className={className} {...props}>
      {orientation === 'horizontal' ? (
        <div className="flex items-start">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              <div className="relative z-10 flex items-center justify-center">
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300
                    ${index < currentStep
                      ? `bg-${activeColor} border-${activeColor} text-white`
                      : index === currentStep
                      ? `border-${activeColor} bg-white text-${activeColor}`
                      : `border-${inactiveColor} bg-white text-${inactiveColor}`
                    }
                  `}
                >
                  {index < currentStep ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon || (
                    <span className="font-bold text-xs">{index + 1}</span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-center w-full px-2">
                <p className={`
                  font-display font-semibold text-xs
                  ${index <= currentStep ? 'text-[#38240d]' : 'text-[#a08a6a]'}
                `}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-[#a08a6a] mt-0.5 line-clamp-1">{step.description}</p>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className="absolute top-4 left-1/2 w-full h-0.5 -translate-x-1/2 z-0"
                  style={{
                    backgroundColor: index < currentStep ? activeColor : inactiveColor,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300
                    ${index < currentStep
                      ? `bg-${activeColor} border-${activeColor} text-white`
                      : index === currentStep
                      ? `border-${activeColor} bg-white text-${activeColor}`
                      : `border-${inactiveColor} bg-white text-${inactiveColor}`
                    }
                  `}
                >
                  {index < currentStep ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon || (
                    <span className="font-bold text-xs">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className="absolute left-3.5 top-8 w-0.5 h-full"
                    style={{
                      backgroundColor: index < currentStep ? activeColor : inactiveColor,
                    }}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <p className={`
                  font-display font-semibold text-xs
                  ${index <= currentStep ? 'text-[#38240d]' : 'text-[#a08a6a]'}
                `}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-[#a08a6a] mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Progress;