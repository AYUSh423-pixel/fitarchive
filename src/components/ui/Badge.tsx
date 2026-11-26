'use client';

import React, { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
  leftIcon?: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      dot = false,
      dotColor,
      leftIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center gap-1 font-bold rounded-full
    `;

    const variantStyles = {
      default: 'bg-[#f5f2e0] text-[#713600]',
      primary: 'bg-[#713600] text-[#fdfbd4]',
      secondary: 'bg-[#fff3e0] text-[#c05800]',
      success: 'bg-[#dcfce7] text-[#166534]',
      warning: 'bg-[#fef9c3] text-[#854d0e]',
      error: 'bg-[#fee2e2] text-[#991b1b]',
      outline: 'bg-transparent border-1.5 border-[#e8e4d0] text-[#713600]',
    };

    const sizeStyles = {
      xs: 'px-2 py-0.5 text-[10px]',
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: dotColor || 'currentColor' }}
            aria-hidden="true"
          />
        )}
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;