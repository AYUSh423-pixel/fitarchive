'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'dashed' | 'dotted';
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'default',
      decorative = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const orientationStyles = {
      horizontal: 'w-full',
      vertical: 'h-full',
    };

    const variantStyles = {
      default: 'bg-[#e8e4d0]',
      dashed: 'border-t-[1px] border-dashed border-[#e8e4d0]',
      dotted: 'border-t-[1px] border-dotted border-[#e8e4d0]',
    };

    return (
      <hr
        ref={ref}
        aria-orientation={orientation}
        role={decorative ? 'none' : 'separator'}
        className={cn(
          'border-0',
          orientationStyles[orientation],
          variantStyles[variant],
          orientation === 'vertical' && 'w-px h-full',
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

export default Separator;