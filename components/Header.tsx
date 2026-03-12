
import React from 'react';
import { Download, Trash2, Undo2, Redo2, Check, Crop } from 'lucide-react';

interface HeaderProps {
  onDownload?: () => void;
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResize?: (w: number, h: number) => void;
  onCrop?: () => void;
  isCropping?: boolean;
  setIsCropping?: (val: boolean) => void;
  setCropRect?: (val: any) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  canvasSize?: { width: number; height: number };
}

const Header: React.FC<HeaderProps> = ({ 
  onDownload, onClear, onUndo, onRedo, onResize, onCrop, 
  isCropping, setIsCropping, setCropRect,
  canUndo, canRedo, canvasSize 
}) => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (canvasSize) setSize(canvasSize);
  }, [canvasSize]);

  return (
    <header className="h-14 md:h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 z-30 shrink-0 sticky top-0">
      <div className="flex items-center gap-1.5 md:gap-4">
        <button 
          onClick={onDownload}
          title="Download"
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition"
        >
          <Download size={14} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>
        
        <div className="hidden xs:block w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button 
          onClick={(e) => { e.stopPropagation(); onClear?.(); }}
          title="Reset All"
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg active:scale-95 transition cursor-pointer z-50"
        >
          <Trash2 size={14} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">Hapus</span>
        </button>

        <div className="flex items-center gap-0.5 md:gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 md:p-1 rounded-lg">
          <button 
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className={`p-1 md:p-1.5 rounded text-slate-500 dark:text-slate-400 ${canUndo ? 'hover:bg-white dark:hover:bg-slate-700' : 'opacity-30 cursor-not-allowed'}`}
          >
            <Undo2 size={14} className="md:w-4 md:h-4" />
          </button>
          <button 
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className={`p-1 md:p-1.5 rounded text-slate-500 dark:text-slate-400 ${canRedo ? 'hover:bg-white dark:hover:bg-slate-700' : 'opacity-30 cursor-not-allowed'}`}
          >
            <Redo2 size={14} className="md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Size:</span>
          <input 
            type="number" 
            value={size.width}
            onChange={(e) => setSize({ ...size, width: parseInt(e.target.value) || 0 })}
            className="w-12 bg-transparent text-xs font-mono text-center focus:outline-none dark:text-slate-200"
          />
          <span className="text-slate-300">×</span>
          <input 
            type="number" 
            value={size.height}
            onChange={(e) => setSize({ ...size, height: parseInt(e.target.value) || 0 })}
            className="w-12 bg-transparent text-xs font-mono text-center focus:outline-none dark:text-slate-200"
          />
          <button 
            onClick={() => onResize?.(size.width, size.height)}
            className="text-teal-500 hover:text-teal-400 transition ml-1"
          >
            <Check size={14} />
          </button>
        </div>
        
        <button 
          onClick={onCrop}
          title={isCropping ? "Apply Crop" : "Quick Crop"}
          className={`flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium border rounded-lg transition active:scale-95 ${isCropping ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600'}`}
        >
          <Crop size={14} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">{isCropping ? 'Potong' : 'Crop'}</span>
        </button>
        {isCropping && (
          <button 
            onClick={() => { setIsCropping?.(false); setCropRect?.(null); }}
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition"
          >
            Batal
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
