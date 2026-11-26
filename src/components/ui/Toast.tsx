'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200);
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#16a34a]" />,
    error: <AlertCircle className="w-5 h-5 text-[#dc2626]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />,
    info: <Info className="w-5 h-5 text-[#3b82f6]" />,
    default: <CheckCircle className="w-5 h-5 text-[#c05800]" />,
  };

  const borderColors = {
    success: 'border-l-4 border-[#16a34a]',
    error: 'border-l-4 border-[#dc2626]',
    warning: 'border-l-4 border-[#f59e0b]',
    info: 'border-l-4 border-[#3b82f6]',
    default: 'border-l-4 border-[#c05800]',
  };

  const bgColors = {
    success: 'bg-[#f0fdf4]',
    error: 'bg-[#fef2f2]',
    warning: 'bg-[#fffbeb]',
    info: 'bg-[#eff6ff]',
    default: 'bg-white',
  };

  return (
    <Card
      variant="white"
      padding="none"
      className={cn(
        'relative overflow-hidden shadow-warm-lg animate-in slide-in-from-right duration-200',
        isExiting && 'animate-out slide-out-to-right duration-200',
        borderColors[toast.type],
        bgColors[toast.type]
      )}
    >
      <div className="p-4 flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-[#38240d]">{toast.title}</p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-[#713600] leading-relaxed">{toast.description}</p>
          )}
          {toast.action && (
            <Button
              variant="ghost"
              size="xs"
              className="mt-2"
              onClick={() => {
                toast.action?.onClick();
                onRemove(toast.id);
              }}
            >
              {toast.action.label}
            </Button>
          )}
        </div>
        {toast.dismissible !== false && (
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onRemove(toast.id), 200);
            }}
            className="flex-shrink-0 p-1 rounded-lg text-[#a08a6a] hover:text-[#38240d] hover:bg-[#f5f2e0] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

export function toast({
  type = 'default',
  title,
  description,
  action,
  duration = 5000,
  dismissible = true,
}: Omit<Toast, 'id'>) {
  // This is a placeholder - actual implementation would use the context
  console.warn('Toast called outside provider. Use useToast() hook instead.');
  return '';
}

export default ToastProvider;