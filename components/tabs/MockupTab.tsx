
import React, { useState } from 'react';
import { Package, Info, Square, RectangleHorizontal, RectangleVertical, Eye, Pencil, Download, Plus, X, Monitor, Wand2, Camera, User, Shirt, LayoutTemplate, RefreshCw } from 'lucide-react';
import { MockupSubTab, AppTab, ToastType } from '../../types';
import { generateImage, analyzeImage } from '../../services/geminiService';
import { MOCKUP_CATEGORIES } from '../../constants';

interface MockupTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onNavigate?: (tab: AppTab) => void;
  onShareImage?: (image: string) => void;
  onToast: (message: string, type: ToastType) => void;
}

const MockupTab: React.FC<MockupTabProps> = ({ onLoading, onNavigate, onShareImage, onToast }) => {
  const [subTab, setSubTab] = useState<MockupSubTab>(MockupSubTab.DESIGN);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState("produk");
  const [subCategory, setSubCategory] = useState("T-shirt");
  const [ratio, setRatio] = useState("1:1");
  const [numOutputs, setNumOutputs] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [customMockup, setCustomMockup] = useState("");
  const [refImage, setRefImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // VTO State
  const [vtoProduct, setVtoProduct] = useState<string | null>(null);
  const [vtoModel, setVtoModel] = useState<string | null>(null);
  const [vtoPrompt, setVtoPrompt] = useState("");
  const [vtoRatio, setVtoRatio] = useState("1:1");

  // Poster State
  const [bnrImage, setBnrImage] = useState<string | null>(null);
  const [bnrText, setBnrText] = useState("");
  const [bnrStyle, setBnrStyle] = useState("");
  const [bnrRatio, setBnrRatio] = useState("1:1");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setRefImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleVtoProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setVtoProduct(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleVtoModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setVtoModel(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleBnrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setBnrImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleGenerateDesign = async () => {
    if (images.length === 0) {
      onToast("Unggah setidaknya 1 desain/logo.", ToastType.WARNING);
      return;
    }
    
    let itemType = subCategory;
    if (category === 'kustom') {
      itemType = customMockup;
      if (!itemType && !refImage) {
        onToast("Isi detail mockup kustom atau unggah referensi.", ToastType.WARNING);
        return;
      }
    }

    onLoading(true, "Merancang Mockup Multi-Sisi (High Fidelity)...");
    
    const finalPrompt = `
      CRITICAL TASK: Hyper-Realistic Product Mockup Generation.
      Target Object: ${itemType}.
      
      INPUT DATA:
      User provided ${images.length} design asset(s).
      ${refImage ? "PLUS a Reference Scene Image (Use this scene's lighting and angle)." : ""}
      
      MANDATORY RULES (ZERO TOLERANCE FOR HALLUCINATION):
      1. DESIGN FIDELITY: The provided Design Assets MUST be applied to the ${itemType} exactly as they appear. 
         - Do NOT change the font, logo shape, or colors of the design.
         - If the design has a white background, treat it as transparent/direct print unless it looks like a sticker.
      2. REALISTIC INTEGRATION: The design must warp correctly around the curves of the ${itemType}. Apply realistic texture, shadows, and lighting over the design.
      3. VARIATION: Create distinct Variations (Different angles or lighting setups).
    `;

    try {
      const allImages = [...images];
      if (refImage) allImages.push(refImage);
      
      // Generate images based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateImage(finalPrompt, allImages, ratio)
      );
      
      const resultsArray = await Promise.all(generationPromises);
      
      setResults(resultsArray.flat().filter(Boolean) as string[]);
    } catch (err: any) {
      onToast(err?.message || "Mockup failed.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleVtoAutoPrompt = async () => {
    if (!vtoProduct) {
      onToast("Unggah foto produk terlebih dahulu.", ToastType.WARNING);
      return;
    }
    onLoading(true, "Menganalisis produk & membuat skenario...");
    try {
      const analysisPrompt = "Kamu adalah creative director fotografi komersial. Tugasmu adalah melihat gambar produk dan membuatkan SATU deskripsi skenario (latar belakang, pencahayaan, suasana) yang sangat cocok untuk produk tersebut agar terlihat menarik dan profesional. Jika ini produk fashion, sarankan latar tempat (misal: cafe, jalanan kota, studio). Jika ini produk makanan/minuman, sarankan latar meja atau dapur. Output HANYA teks deskripsi dalam Bahasa Indonesia. Singkat, padat, menarik.";
      const result = await analyzeImage(analysisPrompt, [vtoProduct]);
      setVtoPrompt(result || "");
    } catch (err: any) {
      onToast(err?.message || "Failed to generate auto prompt.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleGenerateVto = async () => {
    if (!vtoProduct) {
      onToast("Unggah foto produk (wajib).", ToastType.WARNING);
      return;
    }

    onLoading(true, vtoModel ? "Mengatur Pose Model & Produk (High Fidelity)..." : "Merancang Konsep Kreatif (High Fidelity)...");
    
    let finalPrompt = "";
    let inputImages = [vtoProduct];

    if (vtoModel) {
      inputImages.push(vtoModel);
      finalPrompt = `
        CRITICAL TASK: High-Fidelity Commercial Photography / Virtual Try-On.
        
        INPUTS:
        Image 1: PRODUCT (Reference for object). 
        Image 2: MODEL (Reference for person).
        
        MANDATORY IDENTITY LOCK RULES (ZERO TOLERANCE):
        1. MODEL PRESERVATION: The person in the final photo MUST be the EXACT person from Image 2. Maintain their face, hair, skin tone, and body proportions perfectly. Do NOT generate a different model.
        2. PRODUCT FIDELITY: The product in the final photo MUST match Image 1 exactly. Maintain brand logos, colors, and material texture.
        3. INTERACTION: The model must wear or interact with the product naturally in the scene.
        4. SCENARIO: ${vtoPrompt || "Professional studio lighting"}.
        5. Aspect Ratio: ${vtoRatio}.
        
        Result: A hyper-realistic commercial advertisement photo.
      `;
    } else {
      if (!vtoPrompt) {
        onToast("Tulis deskripsi skenario/latar karena tidak ada model.", ToastType.WARNING);
        onLoading(false);
        return;
      }
      finalPrompt = `
        CRITICAL TASK: Realistic Product Photography (Scene Generation).
        Image 1 is the HERO PRODUCT.
        
        MANDATORY RULES:
        1. PRODUCT PRESERVATION: The object in the photo MUST BE IDENTICAL to Image 1. Keep all text, labels, and shapes exactly as they are. 
        2. SCENE INTEGRATION: Place the product in this scene: "${vtoPrompt}". Ensure shadows and reflections match the environment.
        3. REALISM: Photorealistic 8k resolution.
        Aspect Ratio: ${vtoRatio}.
      `;
    }

    try {
      // Generate images based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateImage(finalPrompt, inputImages, vtoRatio)
      );
      
      const resultsArray = await Promise.all(generationPromises);
      
      setResults(resultsArray.flat().filter(Boolean) as string[]);
    } catch (err: any) {
      onToast(err?.message || "Photoshoot generation failed.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleBnrAutoText = async () => {
    if (!bnrImage) {
      onToast("Unggah gambar dulu.", ToastType.WARNING);
      return;
    }
    onLoading(true, "Copywriting Iklan (Analisis Produk)...");
    try {
      const analysisPrompt = `
        Bertindaklah sebagai Senior Copywriter Profesional. Tugasmu adalah membuat Headline Iklan untuk produk dalam gambar.
        ATURAN KHUSUS (WAJIB PATUH):
        1. BAHASA: Gunakan Bahasa Indonesia yang kreatif, persuasif, tapi EJAAN HARUS BENAR (Baku/EYD). Jangan ada typo.
        2. MEREK: Jika ada teks merek/brand di produk yang terlihat SANGAT JELAS, tuliskan persis sesuai ejaannya. JIKA BURAM/RAGU, JANGAN DITEBAK/DITULIS. Lebih baik fokus ke jenis produk (misal: "Sambal Pedas", "Kopi Nikmat") daripada salah tulis merek.
        3. GAYA: Singkat, Padat, Menjual (Punchy).
        4. PANJANG: Maksimal 8-10 kata.
        5. OUTPUT: Hanya teks headline saja, tanpa tanda kutip atau pembuka.
      `;
      let result = await analyzeImage(analysisPrompt, [bnrImage]);
      if (result) {
        result = result.replace(/^["']|["']$/g, '');
        setBnrText(result);
      }
    } catch (err: any) {
      onToast(err?.message || "Failed to generate text.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleBnrAutoStyle = async () => {
    if (!bnrImage) {
      onToast("Unggah gambar dulu.", ToastType.WARNING);
      return;
    }
    onLoading(true, "Menyarankan gaya...");
    try {
      const analysisPrompt = "Sarankan gaya desain visual (warna, mood, layout) yang cocok untuk banner iklan produk ini. Singkat saja.";
      const result = await analyzeImage(analysisPrompt, [bnrImage]);
      setBnrStyle(result || "");
    } catch (err: any) {
      onToast(err?.message || "Failed to generate style.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleGeneratePoster = async () => {
    if (!bnrImage) {
      onToast("Unggah gambar utama.", ToastType.WARNING);
      return;
    }
    if (!bnrText) {
      onToast("Isi teks banner.", ToastType.WARNING);
      return;
    }

    onLoading(true, "Merancang Poster Iklan (High Fidelity)...");
    
    const finalPrompt = `
      CRITICAL TASK: High-Fidelity Advertisement Poster Generation.
      
      INPUT:
      Image 1 is the MAIN PRODUCT.
      
      RULES:
      1. PRODUCT PRESERVATION: The product from Image 1 must be the central focus and look EXACTLY as uploaded. Do NOT hallucinate a different product.
      2. LAYOUT & TEXT: Create a balanced ad layout featuring the text "${bnrText}" clearly.
      3. STYLE: ${bnrStyle || "Professional, modern, commercial"}.
      Aspect Ratio: ${bnrRatio}.
    `;

    try {
      // Generate images based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateImage(finalPrompt, [bnrImage], bnrRatio)
      );
      
      const resultsArray = await Promise.all(generationPromises);
      
      setResults(resultsArray.flat().filter(Boolean) as string[]);
    } catch (err: any) {
      onToast(err?.message || "Poster generation failed.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockup-${Date.now()}.png`;
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
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-rose-600 transition-colors"
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
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-600 mb-2 md:mb-4 tracking-tight">
          AI Mockup
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-2xl text-left">
          <Package size={16} className="text-rose-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            create product mockups, lifestyle photoshoots product, or advertising posters in one place.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 border dark:border-slate-800 overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: MockupSubTab.DESIGN, label: 'Desain' },
            { id: MockupSubTab.PRODUCT, label: 'Fotoshoot' },
            { id: MockupSubTab.POSTER, label: 'Poster' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setSubTab(tab.id); setResults([]); }}
              className={`
                px-4 md:px-6 py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap
                ${subTab === tab.id 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 h-full">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6">
            
            {subTab === MockupSubTab.DESIGN && (
              <>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Assets ({images.length}/3)</label>
                  <div className="flex flex-wrap gap-2 p-3 min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={10} /></button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-800 flex flex-col items-center justify-center text-rose-500 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <Plus size={18} />
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} accept="image/*" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[...MOCKUP_CATEGORIES, { id: 'kustom', label: 'Kustom', icon: 'Edit3', options: [] }].map((cat) => {
                      const Icon = cat.icon === 'Package' ? Package : cat.icon === 'Box' ? Package : cat.icon === 'Printer' ? Monitor : cat.icon === 'Briefcase' ? Monitor : cat.icon === 'Monitor' ? Monitor : cat.icon === 'Share2' ? Monitor : cat.icon === 'MapPin' ? Monitor : Pencil;
                      return (
                      <button
                        key={cat.id}
                        onClick={() => { setCategory(cat.id); setSubCategory(cat.options[0] || ""); }}
                        className={`
                          p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all
                          ${category === cat.id 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}
                        `}
                      >
                        <Icon size={12} />
                        <span className="text-[7px] font-bold uppercase truncate w-full text-center">{cat.label}</span>
                      </button>
                    )})}
                  </div>
                  
                  {category === 'kustom' ? (
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input 
                        type="text" 
                        value={customMockup}
                        onChange={(e) => setCustomMockup(e.target.value)}
                        placeholder="Cth: Botol parfum kaca mewah..."
                        className="w-full p-2 text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                      />
                      <div className="text-center text-[10px] text-slate-400">- ATAU UNGGAH REFERENSI -</div>
                      <label className="w-full block py-2 text-xs text-center border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 cursor-pointer hover:bg-white dark:hover:bg-slate-800">
                        {refImage ? "Referensi Terunggah (Ganti?)" : "Unggah Gambar Referensi (Scene)"}
                        <input type="file" className="hidden" onChange={handleRefUpload} accept="image/*" />
                      </label>
                    </div>
                  ) : (
                    <select 
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    >
                      {MOCKUP_CATEGORIES.find(c => c.id === category)?.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Ratio</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: '1:1', icon: Square },
                      { id: '16:9', icon: RectangleHorizontal },
                      { id: '9:16', icon: RectangleVertical },
                    ].map((r) => (
                      <button key={r.id} onClick={() => setRatio(r.id)} className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 ${ratio === r.id ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        <r.icon size={12} /> {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Jumlah Output ({numOutputs})</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={numOutputs}
                    onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGenerateDesign}
                    disabled={images.length === 0}
                    className="w-full py-3.5 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    <Package size={18} /> Generate
                  </button>
                  <button 
                    onClick={() => { setResults([]); setImages([]); setRefImage(null); setPrompt(""); setCustomMockup(""); }}
                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RefreshCw size={18} /> Reset
                  </button>
                </div>
              </>
            )}

            {subTab === MockupSubTab.PRODUCT && (
              <>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Aset Fotoshoot</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="w-full aspect-square rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-700 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20 relative overflow-hidden">
                        {vtoProduct ? (
                          <>
                            <img src={vtoProduct} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] text-center py-0.5 font-bold">WAJIB</div>
                          </>
                        ) : (
                          <>
                            <Shirt size={24} className="text-rose-500 mb-2" />
                            <span className="text-[10px] font-bold text-rose-600">PRODUK</span>
                            <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[8px] text-center py-0.5 font-bold">WAJIB</div>
                          </>
                        )}
                        <input type="file" className="hidden" onChange={handleVtoProductUpload} accept="image/*" />
                      </label>
                    </div>
                    <div className="flex items-center justify-center text-slate-300"><Plus size={20} /></div>
                    <div className="flex-1">
                      <label className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 relative overflow-hidden">
                        {vtoModel ? (
                          <>
                            <img src={vtoModel} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-slate-500 text-white text-[8px] text-center py-0.5 font-bold">OPSIONAL</div>
                          </>
                        ) : (
                          <>
                            <User size={24} className="text-slate-400 mb-2" />
                            <span className="text-[10px] font-bold text-slate-500">MODEL</span>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-500 text-white text-[8px] text-center py-0.5 font-bold">OPSIONAL</div>
                          </>
                        )}
                        <input type="file" className="hidden" onChange={handleVtoModelUpload} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Instruksi (Opsional)</label>
                    <button onClick={handleVtoAutoPrompt} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline">
                      <Wand2 size={12} /> Auto Prompt
                    </button>
                  </div>
                  <textarea 
                    value={vtoPrompt}
                    onChange={(e) => setVtoPrompt(e.target.value)}
                    placeholder="Contoh: Model sedang berjalan di kota, gaya casual..."
                    className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Ratio</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: '1:1', icon: Square },
                      { id: '16:9', icon: RectangleHorizontal },
                      { id: '9:16', icon: RectangleVertical },
                    ].map((r) => (
                      <button key={r.id} onClick={() => setVtoRatio(r.id)} className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 ${vtoRatio === r.id ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        <r.icon size={12} /> {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Jumlah Output ({numOutputs})</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={numOutputs}
                    onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGenerateVto}
                    disabled={!vtoProduct}
                    className="w-full py-3.5 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    <Camera size={18} /> Generate
                  </button>
                  <button 
                    onClick={() => { setResults([]); setVtoProduct(null); setVtoModel(null); setVtoPrompt(""); }}
                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RefreshCw size={18} /> Reset
                  </button>
                </div>
              </>
            )}

            {subTab === MockupSubTab.POSTER && (
              <>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">1. Unggah Gambar Utama</label>
                  <label className="w-full h-40 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-700 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/20 relative overflow-hidden">
                    {bnrImage ? (
                      <img src={bnrImage} className="w-full h-full object-contain p-2" />
                    ) : (
                      <>
                        <LayoutTemplate size={32} className="text-rose-500 mb-2" />
                        <span className="text-xs text-slate-500">Klik / Drop Gambar Produk</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={handleBnrUpload} accept="image/*" />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Teks Banner</label>
                    <button onClick={handleBnrAutoText} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline">
                      <Wand2 size={12} /> Auto Prompt
                    </button>
                  </div>
                  <textarea 
                    value={bnrText}
                    onChange={(e) => setBnrText(e.target.value)}
                    placeholder="Tulis teks untuk banner..."
                    className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none h-20"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">3. Gaya Desain</label>
                    <button onClick={handleBnrAutoStyle} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline">
                      <Wand2 size={12} /> Auto Prompt
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={bnrStyle}
                    onChange={(e) => setBnrStyle(e.target.value)}
                    placeholder="Cth: Minimalis, Neon, Elegan..."
                    className="w-full p-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">4. Ratio</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: '1:1', icon: Square },
                      { id: '16:9', icon: RectangleHorizontal },
                      { id: '9:16', icon: RectangleVertical },
                    ].map((r) => (
                      <button key={r.id} onClick={() => setBnrRatio(r.id)} className={`p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 ${bnrRatio === r.id ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                        <r.icon size={12} /> {r.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">5. Jumlah Output ({numOutputs})</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={numOutputs}
                    onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleGeneratePoster}
                    disabled={!bnrImage || !bnrText}
                    className="w-full py-3.5 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    <LayoutTemplate size={18} /> Generate
                  </button>
                  <button 
                    onClick={() => { setResults([]); setBnrImage(null); setBnrText(""); setBnrStyle(""); }}
                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RefreshCw size={18} /> Reset
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

        <div className="lg:col-span-7 h-full">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[300px] h-full flex flex-col items-center justify-center">
            {results.length === 0 ? (
              <div className="text-center opacity-40">
                <Package size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variations will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-2">
                {results.map((res, i) => (
                  <div key={i} className="relative group rounded-2xl overflow-hidden shadow-lg border dark:border-slate-700 aspect-square md:aspect-auto">
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
        </div>
      </div>
    </div>
  );
};

export default MockupTab;
