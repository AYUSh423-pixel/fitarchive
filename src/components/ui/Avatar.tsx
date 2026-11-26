'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      fallback,
      size = 'md',
      shape = 'circle',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      xs: 'w-6 h-6 text-[10px]',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
      '2xl': 'w-24 h-24 text-xl',
    };

    const shapeStyles = {
      circle: 'rounded-full',
      square: 'rounded-2xl',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const [imageError, setImageError] = React.useState(false);

    if (src && !imageError) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative inline-flex items-center justify-center overflow-hidden bg-[#f5f2e0]',
            sizeStyles[size],
            shapeStyles[shape],
            className
          )}
          {...props}
        >
          <img
            src={src}
            alt={alt || ''}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            aria-hidden={!!fallback}
          />
        </div>
      );
    }

    const initials = fallback || alt || '?';
    const bgColors = [
      'bg-[#713600]',
      'bg-[#c05800]',
      'bg-[#5d4037]',
      'bg-[#a08a6a]',
      'bg-[#8d6e63]',
      'bg-[#6d4c41]',
    ];
    const colorIndex = initials.charCodeAt(0) % bgColors.length;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-bold text-white',
          sizeStyles[size],
          shapeStyles[shape],
          bgColors[colorIndex],
          className
        )}
        {...props}
        aria-label={alt || fallback}
      >
        {getInitials(initials)}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  overlap?: number;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max = 5, size = 'md', overlap = -8, className = '', ...props }, ref) => {
    const sizeStyles = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      '2xl': 'w-24 h-24',
    };

    const validChildren = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<AvatarProps>[];
    const visibleChildren = validChildren.slice(0, max);
    const remainingCount = validChildren.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            className="relative"
            style={{
              zIndex: visibleChildren.length - index,
              marginLeft: index > 0 ? overlap : 0,
            }}
          >
            {React.cloneElement(child, {
              size,
              className: cn('ring-2 ring-white', child.props.className),
            })}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              'inline-flex items-center justify-center font-bold text-white ring-2 ring-white',
              sizeStyles[size],
              'rounded-full',
              'bg-[#a08a6a]'
            )}
            style={{ marginLeft: overlap, zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;