
import React, { useState } from 'react';
import { Sparkles, Info, Wand2, RefreshCw, Square, RectangleHorizontal, RectangleVertical, Eye, Download, Pencil, Plus, X, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { generateImage, analyzeImage } from '../../services/geminiService';
import { AppTab, ToastType } from '../../types';

interface AIImagingTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
  onNavigate?: (tab: AppTab) => void;
  onShareImage?: (image: string) => void;
}

const alternativePlatforms = [
  {
    name: "Leonardo AI",
    desc: "Premium Image Gen",
    tag: "FREE DAILY",
    url: "https://leonardo.ai",
    img: "https://picsum.photos/seed/leonardo/400/225"
  },
  {
    name: "Playground AI",
    desc: "Mixed Image Editor",
    tag: "FREE (1000/DAY)",
    url: "https://playgroundai.com",
    img: "https://picsum.photos/seed/playground/400/225"
  },
  {
    name: "SeaArt",
    desc: "Stable Diffusion Web",
    tag: "FREE DAILY",
    url: "https://seaart.ai",
    img: "https://picsum.photos/seed/seaart/400/225"
  },
  {
    name: "Adobe Firefly",
    desc: "Generative Fill",
    tag: "FREE CREDITS",
    url: "https://firefly.adobe.com",
    img: "https://picsum.photos/seed/firefly/400/225"
  }
];

const AIImagingTab: React.FC<AIImagingTabProps> = ({ onLoading, onToast, onNavigate, onShareImage }) => {
  const [images, setImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic (Default)");
  const [cameraAngle, setCameraAngle] = useState("Default (Bawaan AI)");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [numOutputs, setNumOutputs] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const STYLES = [
    "Cinematic (Default)",
    "Prewedding / Romantis",
    "Ulang Tahun / Ceria",
    "Foto Keluarga / Hangat",
    "Fantasy Art",
    "Cyberpunk / Neon",
    "Caricature Art / Seni Karikatur",
    "Painting Art / Seni Lukis",
    "Pencil Sketch Art (Sketsa Pensil)"
  ];

  const CAMERA_ANGLES = [
    "Default (Bawaan AI)",
    "Eye Level (Sejajar Mata)",
    "Low Angle (Dari Bawah - Megah)",
    "High Angle (Dari Atas)",
    "Top Down / Flat Lay (Tegak Lurus)",
    "Drone View (Pemandangan Udara)",
    "Isometric (Isometrik 3D)",
    "Macro / Close Up (Detail Dekat)",
    "Wide Angle (Sudut Lebar)",
    "Selfie Style"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (images.length + files.length > 5) {
      onToast("Maksimal 5 gambar diperbolehkan", ToastType.WARNING);
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input value to allow re-uploading the same file
    e.target.value = "";
  };

  const handleAutoPrompt = async () => {
    if (images.length === 0) {
      onToast("Silahkan unggah setidaknya satu gambar untuk Auto Prompt.", ToastType.WARNING);
      return;
    }
    onLoading(true, "Analyzing images for magic instructions...");
    try {
      const analysisPrompt = `
        Analyze the provided images and create a highly detailed, professional, and creative prompt for an AI image generator.
        The goal is to merge or enhance these images into a single masterpiece.
        Focus on:
        - Subject details and preservation of identity.
        - Lighting, mood, and atmosphere.
        - Composition and artistic style.
        - Specific visual elements from the source images.
        
        Return ONLY the prompt text, no extra commentary.
      `;
      const result = await analyzeImage(analysisPrompt, [images[0]]);
      setPrompt(result || "");
    } catch (err: any) {
      onToast(err?.message || "Gagal menghasilkan auto prompt.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (images.length < 1 && !prompt) return;
    onLoading(true, "Merging visuals & generating magic...");
    try {
      const fullPrompt = `
        TASK: High-Fidelity Identity-Locked Image Compositing.
        
        INPUTS:
        The user provided ${images.length} reference images of specific PEOPLE/SUBJECTS.
        
        MANDATORY IDENTITY LOCK RULES (ZERO TOLERANCE):
        1. FACE & FEATURES: You MUST use the EXACT facial features from the input images. Do NOT generate a "similar" person. It must be the SAME person. Keep every detail of the eyes, nose, lips, and facial structure.
        2. BODY PROPORTIONS: Maintain the original body proportions, height, and build of the subjects as seen in the source images. Do not crop or alter the body unless it's necessary for the composition.
        3. CLOTHING: Preserve the original clothing/outfit from the input images unless the user explicitly requested a change.
        4. NO REGENERATION: Do not "re-imagine" the person. Place the EXISTING person into the new scene.
        
        USER INSTRUCTION: "${prompt}".
        
        ENVIRONMENTAL STYLE: ${style}.
        Camera Angle: ${cameraAngle}.
        Output Aspect Ratio: ${aspectRatio}.
        
        The result must look like a real photograph of the subjects in the new environment.
      `;
      
      // Generate images based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateImage(fullPrompt, images, aspectRatio)
      );
      
      const resultsArray = await Promise.all(generationPromises);
      
      setResults(resultsArray.flat().filter(Boolean) as string[]);
    } catch (err: any) {
      onToast(err?.message || "Gagal menghasilkan gambar.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-imaging-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (url: string) => {
    if (onShareImage && onNavigate) {
      onShareImage(url);
      onNavigate(AppTab.EDITOR);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full pb-24">
      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" 
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-8 flex gap-4">
            <button 
              onClick={() => handleDownload(previewImage)}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-teal-600 transition-colors"
            >
              <Download size={20} /> Download
            </button>
            <button 
              onClick={() => handleEdit(previewImage)}
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <Pencil size={20} /> Edit in Studio
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-teal-600 mb-2 md:mb-4 tracking-tight">
          AI Imaging
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800 rounded-2xl text-left">
          <Info size={16} className="text-teal-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            upload your images (max. 5 foto), write instructions, and let AI merge them into a single unique masterpiece.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* LEFT COLUMN: INPUT */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 h-full flex flex-col">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Source Assets ({images.length}/5)</label>
              <div className="flex flex-wrap gap-2 p-3 min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <Plus size={20} />
                    <span className="text-[8px] font-bold">ADD</span>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Instruksi</label>
                <button 
                  onClick={handleAutoPrompt}
                  className="text-[10px] font-bold text-teal-500 flex items-center gap-1 hover:underline"
                >
                  <Wand2 size={12} /> Auto Prompt
                </button>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Gabungkan kucing dan astronot, buat suasana futuristik..."
                className="w-full p-4 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none flex-1 min-h-[120px] resize-none transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Pilih Gaya</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500"
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Sudut Kamera (Opsional)</label>
              <select 
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CAMERA_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">5. Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '1:1', icon: Square },
                  { id: '16:9', icon: RectangleHorizontal },
                  { id: '9:16', icon: RectangleVertical },
                ].map((ratio) => {
                  const Icon = ratio.icon;
                  return (
                      <button
                        key={ratio.id}
                        onClick={() => setAspectRatio(ratio.id)}
                      className={`
                        flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-[10px] transition-all
                        ${aspectRatio === ratio.id 
                          ? 'bg-teal-500 text-white border-teal-500 shadow-md' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-teal-500'}
                      `}
                    >
                      <Icon size={12} /> {ratio.id}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">6. Jumlah Output ({numOutputs})</label>
              <input 
                type="range" 
                min="1" 
                max="6" 
                value={numOutputs} 
                onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={handleGenerate}
                disabled={images.length === 0}
                className="w-full py-3.5 bg-teal-500 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Sparkles size={18} /> Generate
              </button>
              <button 
                onClick={() => { setResults([]); setPrompt(""); setImages([]); }}
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
            {results.length === 0 ? (
              <div className="text-center opacity-40">
                <ImageIcon size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated variations will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full animate-in fade-in zoom-in-95 duration-500">
                {results.map((res, i) => (
                  <div key={i} className="relative group/item rounded-2xl overflow-hidden shadow-lg border dark:border-slate-700 aspect-square">
                    <img src={res} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-around md:translate-y-full md:group-hover/item:translate-y-0 transition-transform">
                      <button 
                        onClick={() => setPreviewImage(res)}
                        className="p-2 bg-white rounded-full text-slate-700 hover:text-blue-500 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEdit(res)}
                        className="p-2 bg-white rounded-full text-slate-700 hover:text-purple-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDownload(res)}
                        className="p-2 bg-white rounded-full text-slate-700 hover:text-teal-500 transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALTERNATIVES SECTION */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Platform Alternatif</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Gunakan platform ini jika kuota API Kamu habis atau ingin variasi lain.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {alternativePlatforms.map((p) => (
                <a 
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:border-teal-500/30 transition-all"
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

export default AIImagingTab;
