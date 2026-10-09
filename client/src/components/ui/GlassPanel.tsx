import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  width?: string;
}

export const GlassPanel: React.FC<Props> = ({
  title,
  subtitle,
  icon,
  headerRight,
  onClose,
  children,
  className = '',
  width = 'w-[380px]',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`glass-panel rounded-2xl flex flex-col max-h-[calc(100vh-6.5rem)] overflow-hidden pointer-events-auto ${width} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-white truncate font-heading">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {headerRight}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </div>
    </motion.div>
  );
};
