'use client';

import React, { forwardRef } from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md';
  selected?: boolean;
  onSelect?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      selected = false,
      onSelect,
      leftIcon,
      rightIcon,
      removable = false,
      onRemove,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center gap-1.5 font-semibold rounded-full
      transition-all duration-200 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      whitespace-nowrap
    `;

    const variantStyles = {
      default: selected
        ? 'bg-[#713600] text-[#fdfbd4] focus-visible:ring-[#713600]'
        : 'bg-[#f5f2e0] text-[#713600] hover:bg-[#e8e4d0] focus-visible:ring-[#713600]',
      primary: selected
        ? 'bg-[#38240d] text-[#fdfbd4] focus-visible:ring-[#38240d]'
        : 'bg-[#f0ece0] text-[#38240d] hover:bg-[#e8e4d0] focus-visible:ring-[#38240d]',
      secondary: selected
        ? 'bg-[#c05800] text-[#fdfbd4] focus-visible:ring-[#c05800]'
        : 'bg-[#fff3e0] text-[#c05800] hover:bg-[#ffe0b2] focus-visible:ring-[#c05800]',
      success: selected
        ? 'bg-[#166534] text-[#dcfce7] focus-visible:ring-[#16a34a]'
        : 'bg-[#dcfce7] text-[#166534] hover:bg-[#bbf7d0] focus-visible:ring-[#16a34a]',
      warning: selected
        ? 'bg-[#854d0e] text-[#fef9c3] focus-visible:ring-[#f59e0b]'
        : 'bg-[#fef9c3] text-[#854d0e] hover:bg-[#fde68a] focus-visible:ring-[#f59e0b]',
      error: selected
        ? 'bg-[#991b1b] text-[#fecaca] focus-visible:ring-[#dc2626]'
        : 'bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] focus-visible:ring-[#dc2626]',
    };

    const sizeStyles = {
      xs: 'px-2 py-1 text-[10px] gap-1',
      sm: 'px-2.5 py-1.5 text-xs gap-1',
      md: 'px-3 py-1.5 text-xs gap-1.5',
    };

    const iconSizeStyles = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onSelect) {
        onSelect();
      }
      if (onClick) {
        onClick(e);
      }
    };

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove();
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        onClick={handleClick}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {leftIcon && <span className={`flex-shrink-0 ${iconSizeStyles[size]}`}>{leftIcon}</span>}
        {children}
        {rightIcon && !removable && <span className={`flex-shrink-0 ${iconSizeStyles[size]}`}>{rightIcon}</span>}
        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
            aria-label="Remove"
          >
            <svg className={`w-3.5 h-3.5 ${iconSizeStyles[size]}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

export interface ChipGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'xs' | 'sm' | 'md';
  orientation?: 'horizontal' | 'vertical';
}

export function ChipGroup({
  options,
  value,
  onChange,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  className = '',
  ...props
}: ChipGroupProps) {
  return (
    <div
      className={`flex ${orientation === 'horizontal' ? 'flex-wrap gap-2' : 'flex-col gap-2'} ${className}`}
      role="radiogroup"
      {...props}
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          variant={variant}
          size={size}
          selected={value === option.value}
          onSelect={() => onChange(option.value)}
          leftIcon={option.icon}
          role="radio"
          aria-checked={value === option.value}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

export default Chip;