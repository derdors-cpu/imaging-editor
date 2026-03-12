
import React from 'react';
import { AppTab } from '../../types';
import { 
  Wand2, Image as ImageIcon, RefreshCw, Sparkles, Camera, 
  Package, Mic, ChevronRight, Film, Info, MessageSquare, Lightbulb
} from 'lucide-react';

interface HomeTabProps {
  onNavigate: (tab: AppTab) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onNavigate }) => {
  const tools = [
    { id: AppTab.CHATBOT, title: 'Chatbot', desc: 'Ask about Imaging Editor', icon: MessageSquare, color: 'cyan' },
    { id: AppTab.RESOURCES, title: 'Resources', desc: 'Information & Changelog', icon: Info, color: 'slate' },
    { id: AppTab.IDEA_PROMPT, title: 'Idea Prompt', desc: 'Generate AI Prompts', icon: Lightbulb, color: 'amber' },
    { id: AppTab.AI_IMAGING, title: 'AI Imaging', desc: 'Combine Images with AI', icon: Sparkles, color: 'teal' },
    { id: AppTab.FOTOMAX, title: 'AI Fotomax', desc: 'Maximize Photos with AI', icon: Camera, color: 'blue' },
    { id: AppTab.MOCKUP, title: 'AI Mockup', desc: 'Branding Tool Product', icon: Package, color: 'rose' },
    { id: AppTab.PICTALK, title: 'AI PicTalk', desc: 'Create Voice Narration', icon: Mic, color: 'emerald' },
    { id: AppTab.AI_CINEMAX, title: 'AI Cinemax', desc: 'Turn images into videos', icon: Film, color: 'orange' },
    { id: AppTab.CONVERTER, title: 'Smart Convert', desc: 'Convert image Formats', icon: RefreshCw, color: 'indigo' },
    { id: AppTab.EDITOR, title: 'Smart Editor', desc: 'Basic Editing and more', icon: ImageIcon, color: 'sky' },
  ];

  const getColorClasses = (color: string) => {
    const mapping: Record<string, string> = {
      teal: 'bg-teal-500/5 border-teal-500/10 hover:bg-teal-500/10 dark:bg-teal-500/10 dark:border-teal-500/20',
      blue: 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10 dark:bg-blue-500/10 dark:border-blue-500/20',
      rose: 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:border-rose-500/20',
      emerald: 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      red: 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10 dark:bg-red-500/10 dark:border-red-500/20',
      orange: 'bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10 dark:bg-orange-500/10 dark:border-orange-500/20',
      yellow: 'bg-yellow-500/5 border-yellow-500/10 hover:bg-yellow-500/10 dark:bg-yellow-500/10 dark:border-yellow-500/20',
      sky: 'bg-sky-500/5 border-sky-500/10 hover:bg-sky-500/10 dark:bg-sky-500/10 dark:border-sky-500/20',
      slate: 'bg-slate-500/5 border-slate-500/10 hover:bg-slate-500/10 dark:bg-slate-500/10 dark:border-slate-500/20',
      cyan: 'bg-cyan-500/5 border-cyan-500/10 hover:bg-cyan-500/10 dark:bg-cyan-500/10 dark:border-cyan-500/20',
      indigo: 'bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10 dark:bg-indigo-500/10 dark:border-indigo-500/20',
      amber: 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:border-amber-500/20',
    };
    return mapping[color] || mapping.slate;
  };

  const getIconClasses = (color: string) => {
    const mapping: Record<string, string> = {
      teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      red: 'bg-red-500/10 text-red-600 dark:text-red-400',
      orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    };
    return mapping[color] || mapping.slate;
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-7 h-7 text-teal-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">IMAGING <span className="text-teal-500">EDITOR</span></h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
          Seamlessly blend your creativity with the power of Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className={`group text-left p-4 md:p-6 rounded-3xl border transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${getColorClasses(tool.color)}`}
            >
              <div className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center ${getIconClasses(tool.color)}`}>
                <Icon size={20} />
              </div>
              <div className="pr-12">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-1">
                  {tool.title}
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeTab;
