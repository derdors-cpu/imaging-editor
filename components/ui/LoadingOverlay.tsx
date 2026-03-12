
import React from 'react';

interface LoadingOverlayProps {
  text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text = "Processing..." }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-teal-500/20 rounded-full" />
        <div className="absolute top-0 w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{text}</p>
        <p className="text-xs text-slate-400 font-medium">Please wait while the AI works its magic</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
