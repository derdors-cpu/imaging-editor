import React, { useState } from 'react';
import { Book, Info, Award, Share2, Heart, X, Link as LinkIcon, Check, Key, TriangleAlert, User } from 'lucide-react';

const ShareModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const url = window.location.href;
  const text = "Check out Imaging Editor V.2.0! Seamlessly blend your creativity with the power of Gemini AI.";

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-green-500">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      bg: 'bg-green-50 hover:bg-green-100 text-green-700',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    },
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-blue-600">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bg: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    },
    {
      name: 'Twitter/X',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-slate-800 dark:text-slate-200">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      bg: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200',
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    },
    {
      name: copied ? 'Disalin!' : 'Salin Link',
      icon: copied ? <Check size={24} className="text-teal-500" /> : <LinkIcon size={24} className="text-slate-600 dark:text-slate-400" />,
      bg: 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300',
      action: () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Bagikan Aplikasi</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={link.action}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all ${link.bg}`}
            >
              {link.icon}
              <span className="text-sm font-bold">{link.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourcesTab: React.FC = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full pb-24 relative">
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-600 mb-2 md:mb-4 tracking-tight">
          Resources & Information
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
          Informasi lengkap seputar pengembangan dan kebijakan Imaging Editor.
        </p>
      </div>

      {/* Changelog */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
          <Award size={24} className="text-blue-500" />
          <h3 className="text-xl font-bold">Changelog</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-1">v2.1.2</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">21-02-2026 <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] rounded-full font-bold">CURRENT</span></p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Rilis Fitur AI Cinemax, serta perbaikan minor lainnya.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold mt-1">v2.0.1</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">18-02-2026</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Peningkatan Stabilitas + UI yang Clean & Minimalist.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold mt-1">v1.6.5</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">12-12-2025</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Optimalisasi feature + AI PicTalk, serta perbaikan minor.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold mt-1">v1.5.6</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">01-11-2025</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Rilis Fitur AI Squad (Imaging, Fotomax, Mockup).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold mt-1">v1.0.1</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">20-06-2025</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Fresh from the oven : Smart Editor & Converter.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Of Service */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
          <Book size={24} className="text-blue-500" />
          <h3 className="text-xl font-bold">Terms Of Service</h3>
        </div>
        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Update kebijakan Google pada Februari 2026 terkait model AI membuat limit generate menjadi lebih terbatas, sekitar di antara 10–50 gambar perhari, tergantung dari jenis akun Google yang dimiliki.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Jika limit token kamu habis, kamu bisa menggunakan akun google yang berbeda dan buat API Key yang baru. Jika tidak ada pilihan akun lain, silahkan akses besok harinya atau gunakan platform AI yang lain.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Pada fitur Generate AI, hasil output dibatasi hingga maksimal 6 variasi. Pembatasan ini bertujuan untuk menghemat kuota akun Google Kamu agar token tidak cepat mencapai limit penggunaan harian.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Sementara fitur AI Cinemax dan AI PicTalk memiliki batas maksimal 2 variasi output.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Imaging Editor dapat digunakan selama layanan Google AI Studio dan model Gemini AI masih tersedia secara publik. Perlu diketahui bahwa Imaging Editor ini dapat berubah atau dihentikan oleh Google tanpa pemberitahuan sebelumnya, karena sepenuhnya bergantung pada ekosistem Google.</span>
          </li>
        </ul>
      </div>

      {/* Cara Setup API Key */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: API Key Setup */}
        <div id="setup-api-key" className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <Key size={24} className="text-amber-500" />
            <h3 className="text-xl font-bold">Cara Setup API Key</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Untuk pengalaman terbaik dan tanpa batas, gunakan Google Gemini API Key pribadi Kamu. Ini gratis dan memastikan semua fitur AI berfungsi optimal. Ikuti langkah-langkah mudah berikut:
            </p>
            <ol className="space-y-4 text-slate-600 dark:text-slate-400 text-sm">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">1</div>
                <span><b>Buka Google AI Studio:</b> Klik link ini untuk membuka halaman resmi pembuatan API Key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-500 hover:underline">Dapatkan API Key</a>.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">2</div>
                <span><b>Buat Kunci Baru:</b> Di halaman tersebut, klik tombol <b>"Create API key in new project"</b>. Ini akan membuatkan kunci unik untuk Kamu.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">3</div>
                <span><b>Salin (Copy) Kunci:</b> Sebuah kode panjang akan muncul. Ini adalah API Key Kamu. Klik ikon salin di sebelahnya. Kode ini biasanya diawali dengan `AIzaSy...`</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">4</div>
                <span><b>Aktivasi di Sini:</b> Kembali ke aplikasi Imaging Editor ini, klik tombol <b>"API Key"</b> di pojok kiri bawah, tempelkan (paste) kode Kamu, lalu klik <b>"Save & Activated"</b>.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">5</div>
                <span><b>Mulai Eksplorasi:</b> Setelah API Key aktif, nikmati dan eksplorasi kreativitas visualmu bersama Imaging Editor.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: Disclaimer & About */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <TriangleAlert size={20} className="text-red-500" />
                <h4 className="font-bold text-slate-800 dark:text-white">Disclaimer</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                API Key kamu disimpan sepenuhnya secara lokal di browser dan tidak pernah dikirim atau disimpan oleh kami. Imaging Editor berjalan di Google AI Studio dan infrastruktur Google untuk memastikan keamanan, serta kompatibilitas langsung dengan model AI resmi tanpa perantara pihak ketiga.
              </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <User size={20} className="text-teal-500" />
                <h4 className="font-bold text-slate-800 dark:text-white">About</h4>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                © 2026 The Imaging Editor, crafted by <a href="https://www.unixcustom.com" target="_blank" rel="noopener noreferrer" className="font-bold text-teal-400 hover:underline">UNIXCUSTOM.COM</a> — an open source AI imaging tool under the MIT License, built to be fast, private, and practical, with API keys stored locally in your browser, intended for personal and community use and not designed for commercial resale; if this project supports your workflow, consider supporting its continued development and future features.
              </p>
          </div>
        </div>
      </div>

      {/* Kontribusi & Donasi */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl text-center space-y-4">
        <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-200">
          <Heart size={24} className="text-pink-500" />
          <h3 className="text-xl font-bold">Kontribusi & Donasi</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
          dukung kami untuk tidak memperjual belikan source kode ini, kamu cukup bagikan tool ini supaya bermanfaat bagi banyak orang. Atau Kamu bisa mendukung penuh dengan cara berdonasi seikhlasnya, agar fitur-fitur baru dapat terus dikembangkan.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-600 transition-colors"
          >
            <Share2 size={16} /> Share
          </button>
          <button 
            onClick={() => window.open('https://www.unixcustom.com/p/support-project.html', '_blank')}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-600 transition-colors"
          >
            <Heart size={16} /> Donasi
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-600 pt-8">
        <p>IMAGING EDITOR • V.2.0 | MADE WITH ♥ IN KOTA BEKASI</p>
      </div>
    </div>
  );
};

export default ResourcesTab;
