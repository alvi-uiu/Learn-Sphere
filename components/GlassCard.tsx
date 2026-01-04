
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => {
  return (
    <div className={`glass rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/30 ${className}`}>
      {children}
    </div>
  );
};
