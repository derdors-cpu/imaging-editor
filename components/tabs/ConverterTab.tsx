
import React, { useState } from 'react';
import { Upload, FileImage, ImageIcon, Globe, Smartphone, X } from 'lucide-react';

import { ToastType } from '../../types';

interface ConverterTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
}

const ConverterTab: React.FC<ConverterTabProps> = ({ onLoading, onToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDownload = (format: string) => {
    if (!preview) return;
    onLoading(true, `Converting to ${format.toUpperCase()}...`);
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `converted.${format}`;
      link.href = preview;
      link.click();
      onLoading(false);
    }, 1200);
  };

  return (
    <div className="h-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
        <div className="p-6 md:p-8 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Converter</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Transform images instantly.</p>
          </div>

          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full aspect-video bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-white transition-all">
              <Upload size={24} className="text-teal-500 mb-2" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Select Image</span>
              <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
            </label>
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden border dark:border-slate-700">
              <img src={preview} className="w-full h-full object-contain bg-slate-950" />
              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"><X size={14} /></button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'png', label: 'PNG', icon: FileImage, color: 'blue' },
              { id: 'jpeg', label: 'JPG', icon: ImageIcon, color: 'orange' },
              { id: 'webp', label: 'WEBP', icon: Globe, color: 'emerald' },
              { id: 'heic', label: 'HEIC', icon: Smartphone, color: 'purple' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                disabled={!preview}
                onClick={() => handleDownload(fmt.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${preview ? 'border-slate-100 dark:border-slate-700 hover:border-teal-500' : 'opacity-30 cursor-not-allowed'}`}
              >
                <fmt.icon size={16} className={`text-${fmt.color}-500`} />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterTab;
