
import React, { useState } from 'react';
import { Camera, UserPlus, Info, Check, RefreshCw, X, Square, RectangleHorizontal, RectangleVertical, Eye, Pencil, Download, ExternalLink } from 'lucide-react';
import { generateImage } from '../../services/geminiService';
import { AppTab, ToastType } from '../../types';

const alternativePlatforms = [
  {
    name: "Bing Image Creator",
    desc: "DALL-E 3 Powered",
    tag: "FREE DAILY",
    url: "https://www.bing.com/images/create",
    img: "https://picsum.photos/seed/bing/400/225"
  },
  {
    name: "Tensor.art",
    desc: "Stable Diffusion Models",
    tag: "FREE CREDITS",
    url: "https://tensor.art",
    img: "https://picsum.photos/seed/tensor/400/225"
  },
  {
    name: "Hugging Face Spaces",
    desc: "Community SD Models",
    tag: "FREE",
    url: "https://huggingface.co/spaces",
    img: "https://picsum.photos/seed/huggingface/400/225"
  },
  {
    name: "Ideogram",
    desc: "High Quality Generation",
    tag: "FREE DAILY",
    url: "https://ideogram.ai",
    img: "https://picsum.photos/seed/ideogram/400/225"
  }
];

interface FotomaxTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
  onNavigate?: (tab: AppTab) => void;
  onShareImage?: (image: string) => void;
}

const FotomaxTab: React.FC<FotomaxTabProps> = ({ onLoading, onToast, onNavigate, onShareImage }) => {
  const [image, setImage] = useState<string | null>(null);
  const [gender, setGender] = useState("male");
  const [theme, setTheme] = useState("Baby Born Photo");
  const [cameraAngle, setCameraAngle] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [numOutputs, setNumOutputs] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const GENDERS = [
    { id: 'male', label: 'Laki-Laki' },
    { id: 'female', label: 'Perempuan' },
    { id: 'couple', label: 'Couple/Pasangan' },
    { id: 'family', label: 'Keluarga/Group' }
  ];

  const THEMES = [
    { id: 'Baby Born Photo', label: 'Baby Born Photo (Bayi)' },
    { id: 'Kids Photo', label: 'Kids Photo (Anak-anak)' },
    { id: 'Foto Umrah / Haji', label: 'Foto Umrah / Haji' },
    { id: 'Pas Foto Warna', label: 'Pas Foto Warna Formal' },
    { id: 'Perbaiki / Restorasi Foto', label: 'Perbaiki / Restorasi Foto Lama' },
    { id: 'Foto Studio Keluarga', label: 'Foto Studio Keluarga/Group' },
    { id: 'Prewedding', label: 'Prewedding / Romantis' },
    { id: 'Caricature Art', label: 'Caricature Art / Seni Karikatur' },
    { id: 'Painting Art', label: 'Painting Art / Seni Lukis' },
    { id: 'Pencil Sketch Art', label: 'Pencil Sketch Art (Sketsa Pensil)' }
  ];

  const CAMERA_ANGLES = [
    { id: '', label: 'Default (Bawaan AI)' },
    { id: 'Eye Level View', label: 'Eye Level (Sejajar Mata)' },
    { id: 'Low Angle Shot', label: 'Low Angle (Dari Bawah - Megah)' },
    { id: 'High Angle Shot', label: 'High Angle (Dari Atas)' },
    { id: 'Top Down Flat Lay', label: 'Top Down / Flat Lay (Tegak Lurus)' },
    { id: 'Drone Aerial View', label: 'Drone View (Pemandangan Udara)' },
    { id: 'Isometric View', label: 'Isometric (Isometrik 3D)' },
    { id: 'Macro Close-Up', label: 'Macro / Close Up (Detail Dekat)' },
    { id: 'Wide Angle Lens', label: 'Wide Angle (Sudut Lebar)' }
  ];

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

  const handleGenerate = async () => {
    if (!image) return;
    onLoading(true, "Memproses Foto di Studio AI (Identity Lock)...");
    
    let subjectDesc = "Person";
    if (gender === 'male') subjectDesc = "Man";
    else if (gender === 'female') subjectDesc = "Woman";
    else if (gender === 'couple') subjectDesc = "Couple";
    else if (gender === 'family') subjectDesc = "Family";

    const angleInstruction = cameraAngle
      ? `Camera Angle: ${cameraAngle}.`
      : `Maintain the original camera angle and composition.`;

    let themePrompt = "";
    let strictnessLevel = "EXTREME";

    if (theme === "Baby Born Photo") {
      themePrompt = "Style: Newborn Photography. Soft lighting, sleeping pose in a basket/wrap.";
      strictnessLevel = "HIGH";
    } else if (theme === "Kids Photo") {
      themePrompt = "Style: Professional Kids Studio Portrait. Happy expression, vibrant background.";
    } else if (theme === "Foto Umrah / Haji") {
      themePrompt = "Context: Performing Umrah/Haji in Mecca. Background: Holy Kaaba/Masjidil Haram. Attire: Appropriate modest white Islamic clothing (Ihram/Hijab).";
    } else if (theme === "Pas Foto Warna") {
      themePrompt = "Style: Formal ID Photo (Pas Foto). Background: Solid Red or Blue. Attire: Formal Suit/Blazer. Expression: Neutral/Formal.";
    } else if (theme === "Perbaiki / Restorasi Foto") {
      themePrompt = "Task: Restoration. Remove scratches, sharpen details, improve lighting/color. Do NOT change features.";
    } else if (theme === "Foto Studio Keluarga") {
      themePrompt = "Style: Professional Family Studio Portrait. Background: Clean minimalist studio backdrop. Lighting: Soft studio lights.";
    } else if (theme === "Prewedding") {
      themePrompt = "Style: Romantic Prewedding. Cinematic lighting.";
    } else if (theme === "Caricature Art") {
      themePrompt = "Style: 3D Caricature Art. Exaggerate features slightly for artistic effect but keep identity recognizable.";
      strictnessLevel = "MODERATE";
    } else if (theme === "Painting Art") {
      themePrompt = "Style: Classic Oil Painting. Visible brush strokes, artistic texture.";
    } else if (theme === "Pencil Sketch Art") {
      themePrompt = "Style: Realistic Pencil Sketch. Graphite on textured paper, monochrome, detailed hatching.";
    } else {
      themePrompt = `Theme: ${theme}`;
    }

    const finalPrompt = `
      CRITICAL TASK: High-Fidelity Identity-Locked Photo Editing.
      
      INPUT: 
      Image 1 is the REFERENCE SUBJECT.
      
      MANDATORY IDENTITY LOCK CONSTRAINTS (ZERO TOLERANCE):
      1. FACE & IDENTITY: The face in the output MUST be an EXACT match to the input image. Do NOT change facial structure, eye color, or any unique features. It must be the SAME person, not a lookalike.
      2. BODY PROPORTIONS: You MUST preserve the subject's original body proportions, build, and posture. Do not alter their physical stature.
      3. MODIFICATION SCOPE: Only modify the [Background], [Lighting], and [Attire] to fit the theme. The subject's biological identity is LOCKED.
      
      THEME INSTRUCTION: ${themePrompt}
      USER ADDITIONAL NOTE: ${prompt}
      ${angleInstruction}
      
      Output Aspect Ratio: ${ratio}.
      The final result must be a hyper-realistic photograph.
    `;

    try {
      // Generate images based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateImage(finalPrompt, [image], ratio)
      );
      
      const resultsArray = await Promise.all(generationPromises);
      
      setResults(resultsArray.flat().filter(Boolean) as string[]);
    } catch (err: any) {
      onToast(err?.message || "Gagal menghasilkan foto.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fotomax-${Date.now()}.png`;
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
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-colors"
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
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-2 md:mb-4 tracking-tight">
          AI Fotomax
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl text-left">
          <Camera size={16} className="text-indigo-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            professional studio at your fingertips. transform any photo into high-end portraits or restore old memories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-5 h-full flex flex-col">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 flex-1 flex flex-col">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Upload Portrait</label>
              <div 
                className="w-full h-40 md:h-48 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all relative overflow-hidden group"
                onClick={() => !image && document.getElementById('foto-upload')?.click()}
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full z-10"><X size={12} /></button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-500 transition-transform">
                      <UserPlus size={20} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tap to upload</span>
                  </div>
                )}
                <input id="foto-upload" type="file" className="hidden" onChange={handleFile} accept="image/*" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Subjek Foto</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GENDERS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Pilih Tema</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Sudut Kamera (Opsional)</label>
              <select 
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CAMERA_ANGLES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">5. Pilih Rasio</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: '1:1', icon: Square },
                  { id: '16:9', icon: RectangleHorizontal },
                  { id: '9:16', icon: RectangleVertical },
                ].map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRatio(r.id)}
                      className={`
                        flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-[10px] transition-all
                        ${ratio === r.id 
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' 
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'}
                      `}
                    >
                      <Icon size={12} /> {r.id}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">6. Tambahan Elemen (Instruksi)</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Latar belakang warna merah, pakai jas hitam, senyum..."
                className="w-full p-4 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none flex-1 min-h-[120px] transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">7. Jumlah Output ({numOutputs})</label>
              <input 
                type="range" 
                min="1" 
                max="6" 
                value={numOutputs} 
                onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="pt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={handleGenerate}
                disabled={!image}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Camera size={18} /> Generate
              </button>
              <button 
                onClick={() => { setResults([]); setImage(null); setPrompt(""); }}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RefreshCw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
            {results.length === 0 ? (
              <div className="text-center p-8 opacity-40">
                <Camera size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variations will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-2 overflow-y-auto custom-scrollbar">
                {results.map((res, i) => (
                  <div key={i} className="relative group rounded-2xl overflow-hidden shadow-lg border dark:border-slate-700 aspect-square">
                    <img src={res} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-around md:translate-y-full md:group-hover:translate-y-0 transition-transform">
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
                  className="group bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-500/30 transition-all"
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

export default FotomaxTab;
