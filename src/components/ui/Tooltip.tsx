'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<any>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate that children is a single React element
  if (!React.isValidElement(children)) {
    throw new Error('Tooltip children must be a single React element');
  }

  const child = children as React.ReactElement<any, any>;
  const childRef = (child as any).ref as React.Ref<HTMLElement>;

  const setRef = (node: HTMLElement | null) => {
    triggerRef.current = node;
    if (typeof childRef === 'function') {
      childRef(node);
    } else if (childRef && typeof childRef === 'object') {
      (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const gap = 8;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = triggerRect.top - tooltipRect.height - gap;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'bottom':
            top = triggerRect.bottom + gap;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'left':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.left - tooltipRect.width - gap;
            break;
          case 'right':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.right + gap;
            break;
        }

        setTooltipPosition({ top, left });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = isVisible && triggerRef.current ? (
    createPortal(
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-50 px-2.5 py-1.5 rounded-xl bg-[#38240d] text-white text-[11px] font-medium whitespace-nowrap shadow-warm-lg',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          className
        )}
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        role="tooltip"
      >
        {content}
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {React.cloneElement(child as React.ReactElement<any>, {
        ref: setRef,
        onMouseEnter: (e: React.MouseEvent) => {
          showTooltip();
          (child.props as any).onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hideTooltip();
          (child.props as any).onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          showTooltip();
          (child.props as any).onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          hideTooltip();
          (child.props as any).onBlur?.(e);
        },
      })}
      {tooltipContent}
    </>
  );
}

export default Tooltip;