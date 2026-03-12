
import React from 'react';
import { AppTab } from '../types';
import { 
  Home, Image as ImageIcon, RefreshCw, Sparkles, Camera, 
  Package, Mic, Moon, Sun, Wand2, X, Film, Key, MessageSquare, Lightbulb, ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, isDarkMode, toggleDarkMode, isOpen, toggleSidebar 
}) => {
  const navItems = [
    { id: AppTab.HOME, label: 'Beranda', icon: Home, color: 'text-blue-400' },
    { id: AppTab.CHATBOT, label: 'Chatbot', icon: MessageSquare, color: 'text-teal-400' },
    { id: AppTab.AI_IMAGING, label: 'AI Imaging', icon: Sparkles, color: 'text-purple-400' },
    { id: AppTab.FOTOMAX, label: 'AI Fotomax', icon: Camera, color: 'text-indigo-400' },
    { id: AppTab.MOCKUP, label: 'AI Mockup', icon: Package, color: 'text-pink-400' },
    { id: AppTab.PICTALK, label: 'AI PicTalk', icon: Mic, color: 'text-emerald-400' },
    { id: AppTab.AI_CINEMAX, label: 'AI Cinemax', icon: Film, color: 'text-red-400' },
    { id: AppTab.CONVERTER, label: 'Converter', icon: RefreshCw, color: 'text-orange-400' },
    { id: AppTab.EDITOR, label: 'Smart Editor', icon: ImageIcon, color: 'text-cyan-400' },
    { id: AppTab.IDEA_PROMPT, label: 'Idea Prompt', icon: Lightbulb, color: 'text-amber-400' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed md:relative top-0 left-0 h-[100dvh] w-72 bg-slate-900 text-white z-50 
        transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col border-r border-slate-800
      `}>
        <div className="flex items-center p-6 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center mr-3">
            <Wand2 className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white uppercase">
            Imaging <span className="text-teal-400">Editor</span>
          </h1>
          <button onClick={toggleSidebar} className="md:hidden ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center px-4 py-3 transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-teal-500/20 to-transparent text-teal-400 border-l-4 border-teal-500' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'}
                `}
              >
                <Icon size={20} className={`mr-3 ${item.color}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => (window as any).openApiKeyModal?.()}
              className="flex items-center justify-center gap-2 p-3 bg-amber-500/10 rounded-xl cursor-pointer hover:bg-amber-500/20 transition-colors border border-amber-500/30 group"
            >
              <Key size={16} className="text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-bold text-amber-500 uppercase">API Key</span>
            </button>

            <div 
              onClick={toggleDarkMode}
              className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700 group"
            >
              {isDarkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
              <span className="text-[10px] font-bold text-slate-300 uppercase">{isDarkMode ? 'Dark' : 'Light'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
