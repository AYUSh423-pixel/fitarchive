'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect?: (value: string, item: DropdownItem) => void;
  placement?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  width?: 'trigger' | 'content' | number | string;
  closeOnSelect?: boolean;
  disabled?: boolean;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  placement = 'bottom',
  align = 'start',
  width = 'content',
  closeOnSelect = true,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect?.(item.value, item);
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const computeStyles = () => {
    const placementStyles = {
      bottom: 'top-full mt-1.5',
      top: 'bottom-full mb-1.5',
      left: 'right-full mr-1.5',
      right: 'left-full ml-1.5',
    };

    const alignStyles = {
      start: placement === 'bottom' || placement === 'top' ? 'left-0' : 'top-0',
      center:
        placement === 'bottom' || placement === 'top'
          ? 'left-1/2 -translate-x-1/2'
          : 'top-1/2 -translate-y-1/2',
      end: placement === 'bottom' || placement === 'top' ? 'right-0' : 'bottom-0',
    };

    return `${placementStyles[placement]} ${alignStyles[align]}`;
  };

  const dropdownContent = (
    <Card
      ref={contentRef}
      variant="white"
      padding="none"
      className={cn(
        'fixed z-50 min-w-[160px] max-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150',
        computeStyles(),
        width === 'trigger' && 'w-[var(--trigger-width)]',
        typeof width === 'number' && `w-[${width}px]`,
        typeof width === 'string' && width !== 'trigger' && width !== 'content' && `w-[${width}]`
      )}
    >
      <div className="py-1.5">
        {items.map((item, index) => (
          item.divider ? (
            <div key={index} className="h-px bg-[#e8e4d0] my-1.5" role="separator" />
          ) : (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={cn(
                'w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 transition-colors',
                'text-xs font-medium',
                item.danger
                  ? 'text-[#dc2626] hover:bg-[#fee2e2]'
                  : 'text-[#38240d] hover:bg-[#f5f2e0]',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="menuitem"
              tabIndex={-1}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0 text-[#a08a6a]">{item.icon}</span>}
              <div className="flex-1 min-w-0">
                <span className="block truncate">{item.label}</span>
                {item.description && (
                  <span className="block text-[10px] text-[#a08a6a] truncate mt-0.5">
                    {item.description}
                  </span>
                )}
              </div>
            </button>
          )
        ))}
      </div>
    </Card>
  );

  const triggerElement = React.isValidElement(trigger)
    ? React.cloneElement(trigger as React.ReactElement<any>, {
        ref: triggerRef,
        onClick: (e: React.MouseEvent) => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
          (trigger.props as any).onClick?.(e);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        rightIcon: <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />,
      })
    : (
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        rightIcon={<ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </Button>
    );

  const portalContent = isOpen ? createPortal(dropdownContent, document.body) : null;

  return (
    <>
      <div className="relative inline-block" style={{ '--trigger-width': 'fit-content' } as React.CSSProperties}>
        {triggerElement}
      </div>
      {portalContent}
    </>
  );
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string; icon?: React.ReactNode; disabled?: boolean }>;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Select({
  value,
  onChange,
  items,
  placeholder,
  label,
  error,
  disabled = false,
  size = 'md',
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find((item) => item.value === value);

  const sizeStyles = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-4 py-3 text-sm',
  };

  const iconSizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-semibold text-[#713600] mb-1.5">{label}</label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full bg-white border-1.5 rounded-2xl',
            'border-[#e8e4d0] text-[#38240d]',
            'transition-all duration-200',
            'focus:outline-none focus:border-[#713600] focus:ring-3 focus:ring-[#713600]/12',
            'disabled:bg-[#f5f2e0] disabled:cursor-not-allowed',
            'flex items-center justify-between',
            error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/12' : '',
            sizeStyles[size]
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 flex-1 text-left">
            {selectedItem?.icon && <span className={cn('flex-shrink-0', iconSizeStyles[size])}>{selectedItem?.icon}</span>}
            <span className={cn('truncate', value ? 'text-[#38240d]' : 'text-[#a08a6a]')}>
              {selectedItem?.label || placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-[#a08a6a] flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <Card
            ref={contentRef}
            variant="white"
            padding="none"
            className="fixed z-50 mt-1.5 left-0 right-0 max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ width: triggerRef.current?.offsetWidth }}
          >
            <div className="py-1.5">
              {items.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (!item.disabled) {
                      onChange(item.value);
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 transition-colors',
                    'text-xs font-medium',
                    value === item.value
                      ? 'bg-[#f5f2e0] text-[#713600]'
                      : 'text-[#38240d] hover:bg-[#f5f2e0]',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  role="option"
                  aria-selected={value === item.value}
                  tabIndex={-1}
                >
                  {item.icon && <span className={cn('w-4 h-4 flex-shrink-0', iconSizeStyles[size])}>{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                  {value === item.value && <Check className="w-3.5 h-3.5 text-[#c05800] ml-auto" />}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-[#dc2626] flex items-center gap-1" role="alert">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default Dropdown;