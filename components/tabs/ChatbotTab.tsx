import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, Loader2, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { chatWithAI } from '../../services/geminiService';
import Markdown from 'react-markdown';
import { AppTab } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `Kamu adalah AI Assistant resmi untuk aplikasi "Imaging Editor". 
Imaging Editor adalah sebuah toolkit atau generator yang berjalan melalui ekosistem Google AI Gemini sebagai tool editor modern untuk berkreasi.

Fitur-fitur utama Imaging Editor meliputi:
1. AI Imaging: Menggabungkan beberapa gambar menjadi satu karya unik dengan AI.
2. AI Fotomax: Menciptakan berbagai variasi model foto serta memaksimalkan kualitas foto dengan AI.
3. AI Mockup: Membuat mockup produk untuk keperluan branding.
4. AI PicTalk: Menghasilkan suara/audio dari teks.
5. AI Cinemax: Mengubah gambar statis menjadi video animasi.
6. Idea Prompt: Merancang dan mengoptimasi instruksi/prompt AI untuk hasil yang lebih profesional.
7. Converter (Smart Convert): Mengonversi format gambar dengan mudah.
8. Smart Editor: Tool editing dasar dan lanjutan.

Tugas Kamu adalah membantu pengguna memahami fitur-fitur ini, memberikan tutorial, tips penggunaan, dan menjawab pertanyaan seputar Imaging Editor. 
Jawablah dengan ramah, profesional, informatif, dan gunakan bahasa Indonesia yang baik dan benar. Jika pengguna bertanya di luar konteks Imaging Editor atau editing gambar/video, arahkan kembali pembicaraan ke topik seputar aplikasi ini dengan sopan.`;

// PLAN B: FAQ Caching Database
const FAQ_DB = [
  {
    keywords: ['apa itu ai imaging', 'fungsi ai imaging', 'cara pakai ai imaging', 'ai imaging'],
    answer: '**AI Imaging** adalah fitur untuk menggabungkan beberapa gambar menjadi satu karya unik menggunakan teknologi AI. Kamu bisa mengunggah gambar referensi dan memberikan prompt teks untuk menghasilkan gambar baru yang kreatif.'
  },
  {
    keywords: ['apa itu ai fotomax', 'fungsi ai fotomax', 'cara pakai fotomax', 'fotomax'],
    answer: '**AI Fotomax** berfungsi untuk menciptakan berbagai variasi model foto serta memaksimalkan dan meningkatkan kualitas (upscale/enhance) foto Kamu menggunakan AI. Sangat cocok untuk berkreasi dengan banyak pilihan gaya sekaligus memperjelas foto yang buram atau beresolusi rendah.'
  },
  {
    keywords: ['apa itu ai mockup', 'fungsi ai mockup', 'cara pakai mockup', 'mockup'],
    answer: '**AI Mockup** memungkinkan Kamu membuat mockup produk profesional untuk keperluan branding. Kamu cukup mengunggah foto produk transparan, lalu AI akan menempatkannya di latar belakang yang realistis sesuai deskripsi Kamu.'
  },
  {
    keywords: ['apa itu ai pictalk', 'fungsi ai pictalk', 'cara pakai pictalk', 'pictalk'],
    answer: '**AI PicTalk** adalah fitur Text-to-Speech (TTS) cerdas. Kamu bisa mengunggah gambar agar AI membuatkan skrip narasi otomatis, lalu mengubah teks tersebut menjadi suara (Voice Over) yang natural.'
  },
  {
    keywords: ['apa itu ai cinemax', 'fungsi ai cinemax', 'cara pakai cinemax', 'cinemax'],
    answer: '**AI Cinemax** dapat mengubah gambar statis Kamu menjadi video animasi pendek yang dinamis (Image-to-Video). Cocok untuk membuat konten visual yang lebih hidup.'
  },
  {
    keywords: ['apa itu idea prompt', 'fungsi idea prompt', 'cara pakai idea prompt', 'idea prompt'],
    answer: '**Idea Prompt** adalah asisten untuk merancang dan mengoptimasi instruksi (prompt) AI. Jika Kamu bingung harus menulis prompt apa untuk AI Imaging, fitur ini akan membantu menyusun prompt yang detail dan profesional.'
  },
  {
    keywords: ['halo', 'hai', 'hello', 'pagi', 'siang', 'sore', 'malam', 'ping', 'test'],
    answer: 'Halo! Ada yang bisa saya bantu seputar fitur-fitur Imaging Editor hari ini?'
  },
  {
    keywords: ['apa itu imaging editor', 'software apa ini', 'aplikasi apa ini', 'tentang imaging editor', 'apa ini'],
    answer: '**Imaging Editor** adalah sebuah toolkit atau generator editing modern berbasis AI yang berjalan melalui ekosistem Google AI Gemini. Aplikasi ini dirancang untuk membantu Kamu berkreasi dengan berbagai fitur canggih mulai dari pengolahan gambar hingga video.'
  },
  {
    keywords: ['fitur', 'fiturnya', 'fitur apa aja', 'daftar fitur', 'ada fitur apa', 'fitur yang ada', 'bisa apa aja'],
    answer: 'Imaging Editor memiliki banyak fitur unggulan, di antaranya:\n1. **AI Imaging**: Menggabungkan gambar dengan AI.\n2. **AI Fotomax**: Membuat variasi serta meningkatkan kualitas foto.\n3. **AI Mockup**: Membuat mockup produk profesional.\n4. **AI PicTalk**: Mengubah teks/gambar menjadi suara.\n5. **AI Cinemax**: Mengubah gambar menjadi video animasi.\n6. **Idea Prompt**: Merancang instruksi AI yang profesional.\n7. **Converter**: Mengonversi format gambar.\n8. **Smart Editor**: Tool editing dasar dan lanjutan.'
  },
  {
    keywords: ['api key', 'gemini api key', 'masukin api key', 'cara dapet api key', 'api key error', 'masalah api key'],
    answer: 'Pembahasan seputar yang kamu tanyakan itu, kamu bisa baca lebih lanjut pada halaman [resources](#resources) ya. Karena saya sudah menjelaskan pertanyaan kamu disana secara spesifik lho. Jangan malas membaca, ingat!! orang mahir itu tercipta karna banyak membaca 😉'
  }
];

const findFAQMatch = (input: string): string | null => {
  const lowerInput = input.toLowerCase();
  for (const faq of FAQ_DB) {
    if (faq.keywords.some(kw => lowerInput.includes(kw))) {
      return faq.answer;
    }
  }
  return null;
};

interface ChatbotTabProps {
  onNavigate: (tab: AppTab) => void;
  apiKey?: string;
}

const ChatbotTab: React.FC<ChatbotTabProps> = ({ onNavigate, apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Halo! Saya adalah Chatbot untuk **Imaging Editor**. Ada yang bisa saya bantu?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: 'Halo! Saya adalah Chatbot untuk **Imaging Editor**. Ada yang bisa saya bantu?'
      }
    ]);
    setInput('');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    const fallbackMessage = "Mohon maaf, pertanyaan kamu belum bisa saya pahami secara spesifik. Sedikit penjelasan, bahwa Imaging Editor adalah sebuah Generator Editing berbasis AI dengan ekosistem Google Gemini dimana memiliki banyak fitur untuk berkreasi.";

    // PLAN B: Check FAQ Cache first (0 Token Cost)
    const faqMatch = findFAQMatch(userText);
    if (faqMatch) {
      setTimeout(() => {
        const newModelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: faqMatch
        };
        setMessages(prev => [...prev, newModelMsg]);
        setIsLoading(false);
      }, 600); // Add slight delay to simulate thinking
      return;
    }

    // If no API Key and no FAQ match, show fallback message
    if (!apiKey) {
      setTimeout(() => {
        const newModelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: fallbackMessage
        };
        setMessages(prev => [...prev, newModelMsg]);
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      // PLAN A: Sliding Window (Limit history to last 6 messages / 3 interactions)
      const MAX_HISTORY = 6;
      const recentMessages = messages.slice(-MAX_HISTORY);
      
      // Format history for Gemini API
      const history = recentMessages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      // Add the new user message to history
      history.push({
        role: 'user',
        parts: [{ text: userText }]
      });

      const responseText = await chatWithAI(history, SYSTEM_INSTRUCTION);

      const newModelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || 'Maaf, saya tidak dapat memproses permintaan Kamu saat ini.'
      };

      setMessages(prev => [...prev, newModelMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: fallbackMessage
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-500 shrink-0">
            <MessageSquare size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Chatbot</h2>
              <ChevronRight size={14} className="text-slate-400" />
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Tanya apa saja seputar fitur dan tutorial penggunaan</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-xs">💡</span>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-teal-600 dark:text-teal-400">Tips:</span> Chatbot memang siap membantu, tapi setiap pertanyaan setelah API Key aktif akan memakai limit. 
                Sebelum bertanya, pastikan kamu sudah membaca panduan di <button onClick={() => onNavigate(AppTab.RESOURCES)} className="text-teal-500 font-bold hover:underline">Resources</button>, 
                karena semua fitur Imaging Editor sudah dijelaskan dari awal. Selamat berkreasi, terus explore kreativitasmu!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                  : 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Sparkles size={20} />}
              </div>
              
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 md:p-4 ${
                msg.role === 'user'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm'
                  : 'bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 text-slate-800 dark:text-slate-300 rounded-tl-sm'
              }`}>
                <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed text-[12px] md:text-sm prose-p:text-[12px] md:prose-p:text-sm prose-li:text-[12px] md:prose-li:text-sm prose-strong:text-[12px] md:prose-strong:text-sm prose-pre:bg-slate-800 prose-pre:text-slate-100">
                  <Markdown
                    components={{
                      a: ({ node, ...props }) => {
                        if (props.href === '#resources') {
                          return (
                            <button 
                              onClick={() => onNavigate(AppTab.RESOURCES)} 
                              className="text-teal-500 font-bold hover:underline cursor-pointer inline-block"
                            >
                              {props.children}
                            </button>
                          );
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline" />;
                      }
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 flex-row">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/20 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-teal-500" />
                <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">Chatbot sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all shadow-sm"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tanyakan sesuatu tentang Imaging Editor..."
              className="flex-1 min-w-0 w-full max-h-32 min-h-[52px] bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-200 p-3 text-xs md:text-sm"
              rows={1}
            />
            <div className="flex items-center gap-2 shrink-0 mb-1 mr-1">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center justify-center"
              >
                <Send size={18} className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                onClick={handleResetChat}
                className="p-3 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-colors flex items-center justify-center"
                title="Bersihkan Obrolan"
              >
                <Trash2 size={18} className="w-[18px] h-[18px]" />
              </button>
            </div>
          </form>
          <div className="text-center mt-2 flex flex-col items-center gap-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Tekan Enter untuk mengirim, Shift + Enter untuk baris baru
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotTab;
