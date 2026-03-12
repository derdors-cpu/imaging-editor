import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Wand2, Bot, Layers, RefreshCw, 
  Terminal, Home, LayoutTemplate, Sun, Moon, 
  BookOpen, History, CheckCircle, X, Share2, 
  Coffee, MessageCircle, Facebook, Twitter, Link as LinkIcon,
  Stars, ChevronRight, Info, Lightbulb
} from 'lucide-react';
import { generateText } from '../../services/geminiService';
import { AppTab } from '../../types';

interface IdeaPromptTabProps {
  onLoading?: (loading: boolean, text?: string) => void;
}

const templates: Record<string, any> = {
  ie_mixer: {
    persona: "Objek Utama / Subjek",
    task: "Pose / Aktivitas Spesifik",
    context: "Latar Belakang / Lokasi",
    format: "Detail Pakaian / Warna",
    tone: "Pencahayaan / Mood",
    constraints: "Jangan ubah wajah, resolusi tinggi, jangan ada blur.",
    default_persona: "Seorang pria dewasa, Wanita berhijab",
    default_task: "Sedang berdansa",
    default_context: "Di tengah hutan pinus",
    default_format: "Jas hitam, Gaun merah",
    default_tone: "Cinematic lighting, Golden hour",
    default_constraints: "Pastikan wajah terlihat jelas, jangan ada distorsi."
  },
  ie_fotomax: {
    persona: "Subjek (Laki-laki/Perempuan/Anak)",
    task: "Pose / Ekspresi Wajah",
    context: "Tema Foto / Latar",
    format: "Detail Pakaian (Outfit)",
    tone: "Nuansa Foto (Vintage/Modern)",
    constraints: "Wajah harus 100% mirip asli (Identity Preservation).",
    default_persona: "Bayi baru lahir",
    default_task: "Tidur pulas",
    default_context: "Studio foto minimalis",
    default_format: "Kostum superhero",
    default_tone: "Soft lighting, Pastel colors",
    default_constraints: "Pertahankan fitur wajah asli, ubah background saja."
  },
  ie_mockup: {
    persona: "Jenis Produk / Objek",
    task: "Tujuan (Desain / Photoshoot / Poster)",
    context: "Tema / Konsep Visual",
    format: "Elemen Tambahan / Branding",
    tone: "Mood / Pencahayaan",
    constraints: "Fidelity Produk & Logo",
    default_persona: "Botol parfum kaca",
    default_task: "Photoshoot produk premium",
    default_context: "Tema minimalis modern",
    default_format: "Logo emas, aksen bunga",
    default_tone: "Luxury lighting, Bright",
    default_constraints: "Logo harus terlihat jelas dan presisi."
  },
  ie_pictalk: {
    persona: "Karakter / Subjek",
    task: "Tujuan Narasi",
    context: "Topik / Isi Cerita",
    format: "Gaya Bahasa / Tone Suara",
    tone: "Emosi / Penekanan",
    constraints: "Durasi / Fokus Narasi",
    default_persona: "Foto portrait pria",
    default_task: "Narasi penjelasan fitur produk",
    default_context: "Menjelaskan keunggulan aplikasi",
    default_format: "Gaya bicara santai dan informatif",
    default_tone: "Ramah, antusias, profesional",
    default_constraints: "Durasi 30 detik, fokus pada manfaat utama."
  },
  ie_cinemax: {
    persona: "Objek / Adegan Utama",
    task: "Gerakan Kamera / Angle",
    context: "Latar Belakang / Lokasi",
    format: "Detail Efek Visual / Style",
    tone: "Mood / Atmosfer",
    constraints: "Durasi / Kualitas",
    default_persona: "Pemandangan pegunungan",
    default_task: "Slow zoom in, Eye-level angle",
    default_context: "Saat matahari terbenam",
    default_format: "Efek partikel debu, Cinematic style",
    default_tone: "Dramatis, Hangat",
    default_constraints: "Durasi 5 detik, 1080p, halus."
  }
};

const IdeaPromptTab: React.FC<IdeaPromptTabProps> = ({ onLoading }) => {
  const [persona, setPersona] = useState('');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [format, setFormat] = useState('');
  const [tone, setTone] = useState('');
  const [constraints, setConstraints] = useState('');
  const [output, setOutput] = useState('');
  const [isJson, setIsJson] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const generatePrompt = () => {
    let finalPrompt = "";
    const isIE = selectedTemplate && selectedTemplate.startsWith('ie_');

    if (isIE) {
      if (selectedTemplate === 'ie_mixer') {
        finalPrompt += "INSTRUKSI: Gabungkan foto-foto yang diunggah menjadi satu komposisi visual yang menyatu (blend).\n\n";
      } else if (selectedTemplate === 'ie_fotomax') {
        finalPrompt += "INSTRUKSI: Ubah foto subjek sesuai dengan Tema dan Gaya berikut (Identity Preservation).\n\n";
      } else if (selectedTemplate === 'ie_mockup') {
        finalPrompt += "INSTRUKSI: Rancang konsep untuk Mockup Produk (Desain/Photoshoot/Poster) dengan detail berikut.\n\n";
      } else if (selectedTemplate === 'ie_pictalk') {
        finalPrompt += "INSTRUKSI: Buat narasi/skrip yang natural untuk subjek foto dengan detail berikut.\n\n";
      } else if (selectedTemplate === 'ie_cinemax') {
        finalPrompt += "INSTRUKSI: Rancang konsep video sinematik dengan pengaturan kamera dan gerakan yang presisi sesuai detail berikut.\n\n";
      }

      if (persona) finalPrompt += `[SUBJECT]: ${persona}\n`;
      if (task) finalPrompt += `[ACTION/POSE]: ${task}\n`;
      if (context) finalPrompt += `[LOCATION/BG]: ${context}\n`;
      if (format) finalPrompt += `[VISUAL DETAILS]: ${format}\n`;
      if (tone) finalPrompt += `[MOOD/LIGHTING]: ${tone}\n`;
      if (constraints) finalPrompt += `[IMPORTANT RULES]: ${constraints}`;
    } else {
      if (persona) finalPrompt += `# ROLE\nAct as: ${persona}\n\n`;
      if (context) finalPrompt += `# CONTEXT\n${context}\n\n`;
      if (task) finalPrompt += `# TASK\n${task}\n\n`;

      if (constraints || tone) {
        finalPrompt += `# STYLE & CONSTRAINTS\n`;
        if (tone) finalPrompt += `- Tone: ${tone}\n`;
        if (constraints) finalPrompt += `- Constraints: ${constraints}\n`;
        finalPrompt += `\n`;
      }

      if (format) finalPrompt += `# OUTPUT FORMAT\n${format}`;
    }

    if (isJson) {
      try {
        finalPrompt = JSON.stringify({ prompt: finalPrompt });
      } catch (e) {
        // Fallback
      }
    }

    setOutput(finalPrompt);
  };

  useEffect(() => {
    generatePrompt();
  }, [persona, task, context, format, tone, constraints, selectedTemplate, isJson]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedTemplate(key);
    if (templates[key]) {
      const t = templates[key];
      const isIE = key.startsWith('ie_');
      if (isIE) {
        setPersona(t.default_persona || "");
        setTask(t.default_task || "");
        setContext(t.default_context || "");
        setFormat(t.default_format || "");
        setTone(t.default_tone || "");
        setConstraints(t.default_constraints || t.constraints || "");
      } else {
        setPersona(t.persona || "");
        setTask(t.task || "");
        setContext(t.context || "");
        setFormat(t.format || "");
        setTone(t.tone || "");
        setConstraints(t.constraints || "");
      }
    } else {
      clearFields();
    }
  };

  const clearFields = () => {
    setPersona('');
    setTask('');
    setContext('');
    setFormat('');
    setTone('');
    setConstraints('');
    setSelectedTemplate('');
    setOutput('');
  };

  const handleMagicFill = async () => {
    if (!output.trim()) {
      triggerToast("Prompt masih kosong!");
      return;
    }
    if (onLoading) onLoading(true, "Optimizing prompt...");
    try {
      const optimized = await generateText(
        output,
        "You are an expert AI prompter. Optimize the user's prompt to be more detailed, professional, and effective for AI models. Maintain the user's original intent but enhance the structure and clarity. Add specific keywords for quality if it's an image prompt. IMPORTANT: Return ONLY the optimized prompt text. Do not include any explanations, conversational filler, or introductory/concluding text."
      );
      setOutput(optimized || "");
      triggerToast("✨ Prompt berhasil dioptimalkan!");
    } catch (error) {
      console.error("Magic Fill failed:", error);
    } finally {
      if (onLoading) onLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    triggerToast("Prompt berhasil disalin!");
  };

  const isIE = selectedTemplate && selectedTemplate.startsWith('ie_');
  const activeT = templates[selectedTemplate] || {};

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full pb-24">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 mb-2 md:mb-4 tracking-tight">
          Idea Prompt
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl text-left">
          <Info size={16} className="text-amber-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            rancang instruksi AI / prompt AI yang sempurna dan optimasi cerdas untuk hasil yang lebih profesional.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Templates */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Template Cepat
              </h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pilih template untuk mengisi form secara otomatis.</p>
              <select 
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none w-full transition-all font-semibold"
              >
                <option value="">Pilih Template...</option>
                <optgroup label="For Imaging Editor Tools">
                  <option value="ie_mixer">🎨 IE: AI Imaging</option>
                  <option value="ie_fotomax">📷 IE: AI Fotomax</option>
                  <option value="ie_mockup">📦 IE: AI Mockup</option>
                  <option value="ie_pictalk">🗣️ IE: AI PicTalk</option>
                  <option value="ie_cinemax">🎬 IE: AI Cinemax</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                1. {isIE ? activeT.persona : "Persona (Siapa AI ini?)"}
              </label>
              <input 
                type="text" 
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400"
                placeholder="Contoh: Senior React Developer..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                2. {isIE ? activeT.task : "Tugas (Apa yang harus dilakukan?)"}
              </label>
              <textarea 
                rows={3}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400 resize-none"
                placeholder="Contoh: Buat prompt gambar..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                3. {isIE ? activeT.context : "Konteks (Latar belakang/Detail)"}
              </label>
              <textarea 
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400 resize-none"
                placeholder="Contoh: Produk sepatu lari..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  4. {isIE ? activeT.format : "Format Output"}
                </label>
                <input 
                  type="text" 
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Contoh: Markdown..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                  5. {isIE ? activeT.tone : "Gaya Bahasa (Tone)"}
                </label>
                <input 
                  type="text" 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Contoh: Persuasif..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                6. Batasan (Constraints)
              </label>
              <textarea 
                rows={2}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl p-3 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder-slate-400 resize-none"
                placeholder="Contoh: Jangan gunakan..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl flex-grow flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                Hasil Prompt
              </h2>
              <div className="flex items-center gap-2">
                {output && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    Siap dicopy
                  </span>
                )}
                <button 
                  onClick={() => {
                    setIsJson(!isJson);
                    triggerToast(isJson ? "✨ Kembali ke teks!" : "✨ Prompt dikonversi ke JSON!");
                  }}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    isJson 
                      ? 'text-white bg-emerald-600 border-emerald-700' 
                      : 'text-white bg-indigo-600 hover:bg-indigo-700 border-indigo-700'
                  }`}
                >
                  {isJson ? 'JSON ON' : 'To JSON'}
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="relative flex-grow bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner group transition-colors">
              <textarea 
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="w-full h-full bg-transparent text-slate-800 dark:text-slate-300 resize-none focus:outline-none font-mono text-sm leading-relaxed no-scrollbar"
                placeholder="Pilih template atau ketik manual, lalu tekan 'Magic Fill AI' untuk optimasi otomatis..."
              />
            </div>

            {/* Actions Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={handleMagicFill}
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all group"
              >
                <Stars size={18} className="group-hover:rotate-12 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Magic Fill AI</span>
              </button>

              <button 
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-black/20 active:scale-95 transition-all group"
              >
                <Copy size={18} className="group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Copy Prompt</span>
              </button>

              <button 
                onClick={clearFields}
                className="flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all group"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                <span className="whitespace-nowrap">Reset</span>
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-[32px] border border-amber-100 dark:border-amber-900/30 border-l-4 border-l-amber-500">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
              <Lightbulb size={14} />
              Workflow Tips
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Gunakan <strong className="text-amber-600 dark:text-amber-400">Magic Fill AI</strong> untuk menyempurnakan prompt yang pendek menjadi detail dan profesional secara instan.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        optgroup {
          font-style: normal !important;
          font-weight: 700;
          color: #64748b;
          background: transparent;
        }
        .dark optgroup {
          color: #94a3b8;
          background: #0f172a;
        }
      `}</style>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400/30 backdrop-blur-md">
            <CheckCircle size={18} />
            <span className="font-bold text-sm">{toastMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaPromptTab;
