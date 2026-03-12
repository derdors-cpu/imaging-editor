
import React, { useState } from 'react';
import { Film, Info, Wand2, RefreshCw, X, Download, Image as ImageIcon, Video, RectangleHorizontal, RectangleVertical, ExternalLink, Share2 } from 'lucide-react';
import { generateVideo } from '../../services/geminiService';

import { ToastType } from '../../types';

interface CinemaxTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
}

const alternativePlatforms = [
  {
    name: "Opal",
    desc: "Sketch to Video",
    tag: "FREE (LABS)",
    url: "https://opal.so",
    img: "https://picsum.photos/seed/opal/400/225"
  },
  {
    name: "Google Flow",
    desc: "Text to Video",
    tag: "FREE TRIAL",
    url: "https://flow.google.com",
    img: "https://picsum.photos/seed/flow/400/225"
  },
  {
    name: "Google Whisk",
    desc: "Image to Video",
    tag: "FREE (LABS)",
    url: "https://whisk.google.com",
    img: "https://picsum.photos/seed/whisk/400/225"
  },
  {
    name: "Gemini (Veo)",
    desc: "Standard Platform",
    tag: "FREE DAILY",
    url: "https://gemini.google.com",
    img: "https://picsum.photos/seed/gemini/400/225"
  },
  {
    name: "Google Vids",
    desc: "Workspace Video",
    tag: "WORKSPACE",
    url: "https://vids.google.com",
    img: "https://picsum.photos/seed/vids/400/225"
  },
  {
    name: "Dreamina",
    desc: "Creative Gen",
    tag: "FREE DAILY",
    url: "https://dreamina.com",
    img: "https://picsum.photos/seed/dreamina/400/225"
  }
];

const CinemaxTab: React.FC<CinemaxTabProps> = ({ onLoading, onToast }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [numOutputs, setNumOutputs] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    
    // Clear input value to allow re-uploading the same file
    e.target.value = "";
  };

  const handleGenerateVideo = async () => {
    if (!prompt) {
        onToast("Silahkan masukkan instruksi untuk video.", ToastType.WARNING);
        return;
    }
    onLoading(true, "Generating AI Video (this takes about 1-2 minutes per video)...");
    setShowAlternatives(false);
    try {
      // Generate videos based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateVideo(prompt, image || undefined, aspectRatio)
      );
      
      const urls = await Promise.all(generationPromises);
      
      const processedUrls = await Promise.all(urls.filter(Boolean).map(async (url) => {
        try {
            const res = await fetch(url!, {
                headers: {
                    'x-goog-api-key': process.env.API_KEY || ''
                }
            });
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error("Failed to fetch video blob, falling back to direct URL", e);
            return url!;
        }
      }));
      
      setVideoUrls(processedUrls);
      setVideoUrl(processedUrls[0] || null);
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Video generation failed.";
      const msg = err?.message?.toLowerCase() || "";
      
      if (msg.includes("not found") || msg.includes("404")) {
        errorMsg = "Model video (Veo) tidak ditemukan atau belum aktif untuk API Key Anda. Pastikan akun Anda memiliki akses ke fitur video di Google AI Studio.";
        setShowAlternatives(true);
      } else if (msg.includes("quota") || msg.includes("limit") || msg.includes("429")) {
        errorMsg = "Kuota generate video Anda telah habis. Fitur ini memiliki batasan yang sangat ketat untuk akun gratis.";
        setShowAlternatives(true);
      } else if (msg.includes("location")) {
        errorMsg = "Fitur video belum tersedia di wilayah Anda.";
      } else {
        errorMsg = err?.message || "Terjadi kesalahan saat membuat video.";
      }
      
      onToast(errorMsg, ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full pb-24">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-600 mb-2 md:mb-4 tracking-tight">
          AI Cinemax
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-2xl text-left">
          <Film size={16} className="text-red-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            turn images into videos. upload an image (optional), describe the motion, and generate cinematic clips.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* LEFT COLUMN: INPUT */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 h-full flex flex-col">
            <div className="text-[10px] text-slate-400 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="flex gap-2">
                <Info size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p>
                  <b className="text-slate-700 dark:text-slate-200">Info:</b> Fitur video (Veo) saat ini masih dalam tahap eksperimental. Jika gagal, gunakan platform alternatif di bawah kolom hasil.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Upload Reference Image (Optional)</label>
              <div 
                className="w-full h-44 md:h-56 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-all relative overflow-hidden group"
                onClick={() => !image && document.getElementById('video-upload')?.click()}
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full"><X size={12} /></button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tap to upload</span>
                  </div>
                )}
                <input id="video-upload" type="file" className="hidden" onChange={handleFile} accept="image/*" />
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Video Description</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the movement, camera angle, and scene details..."
                className="w-full p-4 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none flex-1 min-h-[150px] resize-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: '16:9', icon: RectangleHorizontal },
                  { id: '9:16', icon: RectangleVertical },
                ].map((r) => (
                  <button key={r.id} onClick={() => setAspectRatio(r.id)} className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${aspectRatio === r.id ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    <r.icon size={16} /> {r.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Jumlah Output (Max 2) ({numOutputs})</label>
              <input
                type="range"
                min="1"
                max="2"
                value={numOutputs}
                onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={handleGenerateVideo}
                disabled={!prompt}
                className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Video size={18} /> Generate
              </button>
              <button 
                onClick={() => { setPrompt(""); setImage(null); setVideoUrl(null); setVideoUrls([]); setShowAlternatives(false); }}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RefreshCw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: OUTPUT + ALTERNATIVES */}
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          {/* OUTPUT SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
            {!videoUrls.length ? (
              <div className="text-center opacity-40">
                <Film size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Video results will appear here</p>
              </div>
            ) : (
              <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
                {videoUrls.map((url, i) => (
                  <div key={i} className="space-y-2">
                    <div className="rounded-2xl overflow-hidden shadow-lg bg-black">
                      <video controls src={url} className="w-full h-auto max-h-[500px]" />
                    </div>
                    <a 
                      href={url} 
                      download={`generated_video_${i + 1}.mp4`}
                      className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                      <Download size={16} /> Download Video {i + 1}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALTERNATIVES SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Platform Alternatif</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Gunakan platform ini jika kuota API Kamu habis atau model belum aktif.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {alternativePlatforms.map((p) => (
                <a 
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:border-red-500/30 transition-all"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold rounded-md uppercase tracking-wider">
                      {p.tag}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink size={24} className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaxTab;
