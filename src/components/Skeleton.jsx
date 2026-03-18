import { motion } from 'framer-motion';

/**
 * Skeleton loading component for cards
 */
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card skeleton-card"
          style={{
            padding: '20px',
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}
        >
          <div className="skeleton-header" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div className="skeleton-avatar" style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: '16px',
                width: '60%',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                marginBottom: '8px'
              }} />
              <div style={{
                height: '12px',
                width: '40%',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite'
              }} />
            </div>
          </div>
          <div style={{
            height: '14px',
            width: '100%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '14px',
            width: '80%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }} />
        </motion.div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
};

/**
 * Table skeleton loading
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="skeleton-table" style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', marginBottom: '16px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{
            height: '20px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', marginBottom: '12px' }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={colIdx} style={{
              height: '16px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              animationDelay: `${rowIdx * 0.1}s`
            }} />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

/**
 * Form skeleton loading
 */
export const SkeletonForm = ({ fields = 4 }) => {
  return (
    <div className="skeleton-form" style={{ padding: '20px' }}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: '20px' }}>
          <div style={{
            height: '14px',
            width: '30%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '44px',
            width: '100%',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            animationDelay: `${i * 0.1}s`
          }} />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

/**
 * Stats card skeleton
 */
export const SkeletonStats = ({ count = 4 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          padding: '20px',
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{
            height: '14px',
            width: '50%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            marginBottom: '12px'
          }} />
          <div style={{
            height: '28px',
            width: '70%',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            animationDelay: '0.1s'
          }} />
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
