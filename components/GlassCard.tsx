
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${
      isDark 
        ? 'glass hover:border-white/30' 
        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
    } ${className}`}>
      {children}
    </div>
  );
};
