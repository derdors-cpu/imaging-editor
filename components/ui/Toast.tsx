
import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastType } from '../../types';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = ToastType.INFO, 
  isVisible, 
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case ToastType.SUCCESS: return <CheckCircle className="text-emerald-500" size={20} />;
      case ToastType.ERROR: return <AlertCircle className="text-rose-500" size={20} />;
      case ToastType.WARNING: return <AlertTriangle className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case ToastType.SUCCESS: return 'bg-slate-900/95 border-emerald-500/50';
      case ToastType.ERROR: return 'bg-slate-900/95 border-rose-500/50';
      case ToastType.WARNING: return 'bg-slate-900/95 border-amber-500/50';
      default: return 'bg-slate-900/95 border-blue-500/50';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
        >
          <div className={`
            pointer-events-auto
            max-w-md w-full 
            ${getBgColor()} 
            border shadow-2xl rounded-[32px] 
            p-8 flex flex-col items-center text-center gap-5
            backdrop-blur-xl
          `}>
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
              {getIcon()}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xl capitalize">
                {type === ToastType.ERROR ? 'Oops!' : type}
              </h4>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="mt-2 w-full py-3.5 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10"
            >
              OK
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
