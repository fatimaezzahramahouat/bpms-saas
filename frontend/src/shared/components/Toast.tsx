import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  const iconBgColors = {
    success: 'bg-green-500/20',
    error: 'bg-red-500/20',
    warning: 'bg-yellow-500/20',
    info: 'bg-blue-500/20',
  };

  return (
    <div
      className={`
        ${bgColors[toast.type]}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        animate-slide-in-right
        flex items-start gap-3
      `}
      role="alert"
    >
      <div className={`${iconBgColors[toast.type]} p-2 rounded-full flex-shrink-0`}>
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-primary)]">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        aria-label="Fermer la notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Helper functions for easy toast usage
export function toastSuccess(title: string, message?: string) {
  return { type: 'success' as ToastType, title, message };
}

export function toastError(title: string, message?: string) {
  return { type: 'error' as ToastType, title, message };
}

export function toastWarning(title: string, message?: string) {
  return { type: 'warning' as ToastType, title, message };
}

export function toastInfo(title: string, message?: string) {
  return { type: 'info' as ToastType, title, message };
}

// Export CSS for animations - should be added to index.css
/*
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
*/
