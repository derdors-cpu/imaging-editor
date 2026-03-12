
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomeTab from './components/tabs/HomeTab';
import EditorTab from './components/tabs/EditorTab';
import ConverterTab from './components/tabs/ConverterTab';
import AIImagingTab from './components/tabs/AIImagingTab';
import FotomaxTab from './components/tabs/FotomaxTab';
import MockupTab from './components/tabs/MockupTab';
import PicTalkTab from './components/tabs/PicTalkTab';
import CinemaxTab from './components/tabs/CinemaxTab';
import ChatbotTab from './components/tabs/ChatbotTab';
import IdeaPromptTab from './components/tabs/IdeaPromptTab';
import ResourcesTab from './components/tabs/ResourcesTab';
import LoadingOverlay from './components/ui/LoadingOverlay';
import ApiKeyModal from './components/ui/ApiKeyModal';
import Toast from './components/ui/Toast';
import { AppTab, ToastType } from './types';
import { LucideIcon, Wand2, Image as ImageIcon, RefreshCw, Sparkles, Camera, Package, Mic, Key, ChevronDown, ChevronUp } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Processing...");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState<boolean>(true);
  const [sharedImage, setSharedImage] = useState<string | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: ToastType.INFO
  });
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    (window as any).openApiKeyModal = () => setIsApiKeyModalOpen(true);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Reload to ensure service uses new key
    window.location.reload();
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLoading = (show: boolean, text: string = "Processing...") => {
    setIsLoading(show);
    setLoadingText(text);
  };

  const handleToast = (message: string, type: ToastType = ToastType.INFO) => {
    setToast({ isVisible: true, message, type });
  };

  const isAiTab = [
    AppTab.AI_IMAGING, 
    AppTab.FOTOMAX, 
    AppTab.MOCKUP, 
    AppTab.PICTALK, 
    AppTab.AI_CINEMAX,
    AppTab.EDITOR,
    AppTab.CONVERTER,
    AppTab.IDEA_PROMPT
  ].includes(activeTab);

  const showBlurOverlay = isAiTab && !apiKey;

  return (
    <div className="flex h-[100dvh] w-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden h-full md:pb-0">
        <div className={`flex-1 overflow-hidden flex flex-col transition-all duration-500 ${showBlurOverlay ? 'blur-xl grayscale pointer-events-none' : ''}`}>
          <div className={`${activeTab === AppTab.HOME ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <HomeTab onNavigate={setActiveTab} />
          </div>
          <div className={`${activeTab === AppTab.EDITOR ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <EditorTab onLoading={handleLoading} onToast={handleToast} initialImage={sharedImage} onClearSharedImage={() => setSharedImage(null)} />
          </div>
          <div className={`${activeTab === AppTab.CONVERTER ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <ConverterTab onLoading={handleLoading} onToast={handleToast} />
          </div>
          <div className={`${activeTab === AppTab.AI_IMAGING ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <AIImagingTab onLoading={handleLoading} onToast={handleToast} onNavigate={setActiveTab} onShareImage={setSharedImage} />
          </div>
          <div className={`${activeTab === AppTab.FOTOMAX ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <FotomaxTab onLoading={handleLoading} onToast={handleToast} onNavigate={setActiveTab} onShareImage={setSharedImage} />
          </div>
          <div className={`${activeTab === AppTab.MOCKUP ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <MockupTab onLoading={handleLoading} onToast={handleToast} onNavigate={setActiveTab} onShareImage={setSharedImage} />
          </div>
          <div className={`${activeTab === AppTab.PICTALK ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <PicTalkTab onLoading={handleLoading} onToast={handleToast} />
          </div>
          <div className={`${activeTab === AppTab.AI_CINEMAX ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <CinemaxTab onLoading={handleLoading} onToast={handleToast} />
          </div>
          <div className={`${activeTab === AppTab.CHATBOT ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <ChatbotTab onNavigate={setActiveTab} apiKey={apiKey} />
          </div>
          <div className={`${activeTab === AppTab.IDEA_PROMPT ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <IdeaPromptTab onLoading={handleLoading} />
          </div>
          <div className={`${activeTab === AppTab.RESOURCES ? "flex-1 overflow-auto no-scrollbar" : "hidden"}`}>
            <ResourcesTab />
          </div>
        </div>

        {/* BYOK Overlay */}
        {showBlurOverlay && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-slate-900/20">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full text-center space-y-5 sm:space-y-6 animate-in zoom-in duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Key size={28} className="text-amber-500 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Bring Your Own Key</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Untuk mengaktifkan fitur AI pada Imaging Editor, silahkan masukkan API Key dari Google Gemini AI</p>
              </div>
              <button 
                onClick={() => setIsApiKeyModalOpen(true)}
                className="w-full py-3.5 sm:py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                Set API Key Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Mobile Floating Action Button */}
        <div className={`md:hidden fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${isMobileMenuVisible ? 'bottom-6' : 'bottom-0'}`}>
          {isMobileMenuVisible ? (
            <div className="flex items-center gap-1.5 bg-slate-900/95 dark:bg-slate-800/95 p-1.5 rounded-full shadow-2xl shadow-teal-500/20 border border-slate-700/50 backdrop-blur-md">
              <button 
                onClick={toggleSidebar}
                className="flex items-center gap-2.5 text-white pl-5 pr-4 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <Wand2 size={18} className="text-teal-400" />
                <span className="text-sm font-bold tracking-wide uppercase">Menu</span>
              </button>
              <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
              <button 
                onClick={() => setIsMobileMenuVisible(false)}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all active:scale-95"
                aria-label="Hide menu"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsMobileMenuVisible(true)}
              className="flex items-center justify-center bg-slate-900/95 dark:bg-slate-800/95 text-teal-400 hover:text-teal-300 px-6 py-2 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border border-b-0 border-slate-700/50 transition-all active:scale-95 backdrop-blur-md"
              aria-label="Show menu"
            >
              <ChevronUp size={20} />
            </button>
          )}
        </div>
      </main>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        onHelp={() => {
          setIsApiKeyModalOpen(false);
          setActiveTab(AppTab.RESOURCES);
        }}
        currentKey={apiKey}
      />

      {isLoading && <LoadingOverlay text={loadingText} />}
      
      <Toast 
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default App;
