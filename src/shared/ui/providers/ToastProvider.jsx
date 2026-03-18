import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  X,
  Loader2
} from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
};

const styles = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  loading: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  // Convenience methods
  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
  const loading = useCallback((message) => addToast(message, 'loading', 0), [addToast]);

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, updateToast, success, error, warning, info, loading }}
    >
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto"
    >
      <div 
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
          shadow-lg min-w-[300px] max-w-[400px]
          ${styles[toast.type]}
        `}
      >
        <Icon 
          size={20} 
          className={toast.type === 'loading' ? 'animate-spin' : ''} 
        />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Hook for promise-based toasts
export const usePromiseToast = () => {
  const { loading, updateToast, removeToast } = useToast();

  const promise = async (promiseFn, { loading: loadingMsg, success: successMsg, error: errorMsg }) => {
    const id = loading(loadingMsg);
    
    try {
      const result = await promiseFn();
      updateToast(id, { 
        type: 'success', 
        message: typeof successMsg === 'function' ? successMsg(result) : successMsg,
        duration: 4000 
      });
      setTimeout(() => removeToast(id), 4000);
      return result;
    } catch (err) {
      updateToast(id, { 
        type: 'error', 
        message: typeof errorMsg === 'function' ? errorMsg(err) : errorMsg,
        duration: 4000 
      });
      setTimeout(() => removeToast(id), 4000);
      throw err;
    }
  };

  return promise;
};
