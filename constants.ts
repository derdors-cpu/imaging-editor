
export const GEMINI_MODELS = {
  TEXT: ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-3.1-pro-preview', 'gemini-2.0-flash'],
  IMAGE: ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview'],
  TTS: ['gemini-2.5-flash-preview-tts'],
  VIDEO: ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview']
};

export const IMAGEN_MODELS = ['imagen-4.0-generate-001'];

export const FONTS = [
  { label: 'Inter (Modern)', value: "'Inter', sans-serif" },
  { label: 'Playfair Display (Elegant)', value: "'Playfair Display', serif" },
  { label: 'Dancing Script (Script)', value: "'Dancing Script', cursive" },
  { label: 'Courier Prime (Retro)', value: "'Courier Prime', monospace" },
  { label: 'Pacifico (Fun)', value: "'Pacifico', cursive" }
];

export const MOCKUP_CATEGORIES = [
  { id: 'produk', label: 'Produk', icon: 'Package', options: ["T-shirt (Kaos)", "Hoodie", "Topi Baseball", "Smartphone Screen", "Laptop Screen"] },
  { id: 'kemasan', label: 'Kemasan', icon: 'Box', options: ["Kotak Produk (Product Box)", "Kantong Kopi (Coffee Pouch)", "Botol Minuman", "Kaleng Soda", "Paper Cup"] },
  { id: 'cetak', label: 'Cetak', icon: 'Printer', options: ["Poster di Dinding", "Kartu Nama", "Brosur/Flyer", "Halaman Majalah", "Buku (Book Cover)"] },
  { id: 'branding', label: 'Branding', icon: 'Briefcase', options: ["Mug Keramik", "Tote Bag", "Pena (Ballpoint)", "Stempel di Kertas", "Logo di Dinding Kantor"] },
  { id: 'digital', label: 'Digital', icon: 'Monitor', options: ["Tampilan Website di iMac", "Tampilan Aplikasi di iPhone", "Tampilan Website di Tablet"] },
  { id: 'sosmed', label: 'Sosmed', icon: 'Share2', options: ["Postingan Instagram di Layar HP", "Profil Facebook di Laptop", "Thumbnail Video YouTube"] },
  { id: 'lingkungan', label: 'Scene', icon: 'MapPin', options: ["Papan Iklan (Billboard) di Kota", "Poster di Halte Bus", "Logo 3D di Fasad Gedung", "Spanduk di Jalan Raya"] }
];
