import React from 'react';

export const ErrorFallback = ({ error }) => (
  <div style={{ 
    padding: '20px', 
    background: '#0f172a', 
    color: '#ef4444',
    fontFamily: 'monospace',
    minHeight: '100vh'
  }}>
    <h2>Xatolik yuz berdi:</h2>
    <pre style={{ background: '#1e293b', padding: '10px', borderRadius: '8px' }}>
      {error?.message || 'Unknown error'}
    </pre>
    <pre style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', marginTop: '10px', fontSize: '12px' }}>
      {error?.stack || ''}
    </pre>
  </div>
);
