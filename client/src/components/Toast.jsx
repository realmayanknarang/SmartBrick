import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '360px'
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

function ToastItem({ message, type }) {
  const colors = {
    success: { bg: '#1a3a2a', border: '#2d6a4f', 
      text: '#52b788', icon: '✓' },
    error: { bg: '#3a1a1a', border: '#6a2d2d', 
      text: '#e07070', icon: '✕' },
    info: { bg: '#1a2b3c', border: '#2E4154', 
      text: '#9fb0bc', icon: 'ℹ' },
    warning: { bg: '#3a2d1a', border: '#6a4f2d', 
      text: '#e8c547', icon: '⚠' },
  };
  const c = colors[type] || colors.info;
  
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '6px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideInRight 0.2s ease-out'
    }}>
      <span style={{ color: c.text, fontSize: '16px', fontWeight: 'bold' }}>
        {c.icon}
      </span>
      <span style={{ color: c.text, fontSize: '13px', 
        lineHeight: 1.4 }}>
        {message}
      </span>
    </div>
  );
}
