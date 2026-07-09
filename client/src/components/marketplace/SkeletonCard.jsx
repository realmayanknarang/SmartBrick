import React from 'react';

export default function SkeletonCard({ lines = 3 }) {
  return (
    <div style={{
      background: '#2E4154',
      borderRadius: '8px',
      padding: '16px',
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{ 
        height: '16px', 
        background: '#3A4F63', 
        borderRadius: '4px',
        marginBottom: '8px',
        width: '60%'
      }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: '12px',
          background: '#3A4F63',
          borderRadius: '4px',
          marginBottom: '6px',
          width: i === lines - 1 ? '40%' : '100%'
        }} />
      ))}
    </div>
  );
}
