'use client';

import React, { forwardRef, isValidElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tabsListStyles = cva(
  'inline-flex items-center justify-center gap-1 bg-[#f0ece0] p-1 rounded-full',
  {
    variants: {
      variant: {
        default: '',
        underline: '',
        pill: '',
      },
    },
  }
);

const tabTriggerStyles = cva(
  'flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'text-[#713600] hover:text-[#38240d] data-[state=active]:bg-[#c05800] data-[state=active]:text-white data-[state=active]:shadow-xs',
        underline: 'bg-transparent text-[#713600] hover:text-[#38240d] data-[state=active]:text-[#c05800] data-[state=active]:pb-1 border-b-2 border-transparent data-[state=active]:border-[#c05800]',
        pill: 'bg-transparent text-[#713600] hover:bg-[#e8e4d0] data-[state=active]:bg-[#713600] data-[state=active]:text-white',
      },
      size: {
        sm: 'px-2.5 py-1 text-[11px]',
        md: 'px-3.5 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'underline' | 'pill';
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tabsListStyles({ variant }), className)}
        role="tablist"
        aria-orientation="horizontal"
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'underline' | 'pill';
  size?: 'sm' | 'md' | 'lg';
  value?: string;
  'data-state'?: 'active' | 'inactive';
}

export const TabTrigger = forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ className, variant = 'default', size = 'md', value, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(tabTriggerStyles({ variant, size }), className)}
        role="tab"
        aria-selected="false"
        {...props}
      />
    );
  }
);
TabTrigger.displayName = 'TabTrigger';

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
}

export const TabContent = forwardRef<HTMLDivElement, TabContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4 animate-in fade-in-0 duration-200', className)}
        role="tabpanel"
        {...props}
      />
    );
  }
);
TabContent.displayName = 'TabContent';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'underline' | 'pill';
  size?: 'sm' | 'md' | 'lg';
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}: TabsProps) {
  const [activeValue, setActiveValue] = React.useState(defaultValue || '');
  const controlled = value !== undefined;

  const handleValueChange = (newValue: string) => {
    if (!controlled) {
      setActiveValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const currentValue = controlled ? value : activeValue;

  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child) => {
        if (!isValidElement(child)) return child;

        if (child.type === TabsList) {
          const tabsListChild = child as React.ReactElement<TabsListProps>;
          return React.cloneElement(tabsListChild, {
            variant,
            children: React.Children.map(tabsListChild.props.children, (trigger) => {
              if (!isValidElement(trigger)) return trigger;
              if (trigger.type === TabTrigger) {
                const triggerProps = trigger.props as TabTriggerProps;
                const triggerValue = (triggerProps.value as string) || triggerProps.children?.toString() || '';
                return React.cloneElement(trigger as React.ReactElement<TabTriggerProps>, {
                  variant,
                  size,
                  'data-state': currentValue === triggerValue ? 'active' : 'inactive',
                  onClick: () => handleValueChange(triggerValue),
                  'aria-selected': currentValue === triggerValue,
                });
              }
              return trigger;
            }),
          });
        }

        if (child.type === TabContent) {
          const tabContentChild = child as React.ReactElement<TabContentProps>;
          const contentValue = (tabContentChild.props.value as string) || '';
          if (currentValue !== contentValue) return null;
          return React.cloneElement(tabContentChild);
        }

        return child;
      })}
    </div>
  );
}

export default Tabs;