import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';

/**
 * Error Display Component
 * Shows error messages with icon and close button
 */
export const ErrorDisplay = ({ error, onClose, style = {} }) => {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="error-display"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          marginBottom: '20px',
          color: '#fca5a5',
          ...style
        }}
      >
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{error}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Success Display Component
 */
export const SuccessDisplay = ({ success, onClose, style = {} }) => {
  if (!success) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="success-display"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          marginBottom: '20px',
          color: '#6ee7b7',
          ...style
        }}
      >
        <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{success}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6ee7b7',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <X size={18} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Info/Warning Display Component
 */
export const InfoDisplay = ({ message, type = 'info', onClose, style = {} }) => {
  if (!message) return null;

  const colors = {
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      color: '#93c5fd',
      iconColor: '#3b82f6'
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      color: '#fcd34d',
      iconColor: '#f59e0b'
    }
  };

  const theme = colors[type] || colors.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          marginBottom: '20px',
          color: theme.color,
          ...style
        }}
      >
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: theme.iconColor }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.color,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Form Field Error
 * Shows inline error for form fields
 */
export const FieldError = ({ error }) => {
  if (!error) return null;

  return (
    <motion.span
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#ef4444',
        fontSize: '12px',
        marginTop: '6px'
      }}
    >
      <AlertCircle size={12} />
      {error}
    </motion.span>
  );
};

/**
 * Loading Button State
 */
export const LoadingButton = ({ isLoading, children, ...props }) => {
  return (
    <button
      disabled={isLoading}
      style={{
        position: 'relative',
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        ...props.style
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <LoadingSpinner size={16} />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Loading Spinner
 */
const LoadingSpinner = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="31.416"
      strokeDashoffset="10"
    />
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </svg>
);

export default ErrorDisplay;
