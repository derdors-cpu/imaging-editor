
import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  onHelp: () => void;
  currentKey: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, onHelp, currentKey }) => {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(key);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />

        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
              <Key size={20} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Setup API Key</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 relative">
          <p className="text-sm text-slate-400 leading-relaxed text-center">
            Aplikasi ini berjalan di browser Kamu (Client-Side) dan membutuhkan <span className="text-white font-bold">Google Gemini API Key</span> pribadi agar fitur AI dapat berfungsi.
          </p>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
              MASUKKAN API KEY:
            </label>
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Key size={18} />
              </div>
              <input 
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-mono"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              *Key disimpan aman di Local Storage browser Kamu, dan Kami Tidak pernah menyimpan / mengirim ke server karna ini berjalan dalam Ekosistem Akun Pribadi Kamu Sendiri.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors group"
            >
              Belum punya? Dapatkan disini (Gratis)
              <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`
                  py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all
                  ${isSaved 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20 active:scale-95'}
                `}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /> Activated
                  </>
                ) : (
                  'Save & Activated'
                )}
              </button>
              <button 
                onClick={onHelp}
                className="py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 border border-slate-700"
              >
                Cara Setup API Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
