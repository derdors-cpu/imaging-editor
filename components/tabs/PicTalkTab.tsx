
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Info, Wand2, RefreshCw, X, Download, UserPlus, Headphones, Volume2, Gauge, Activity } from 'lucide-react';
import { analyzeImage, generateSpeech } from '../../services/geminiService';
import { base64ToArrayBuffer, pcmToWav } from '../../utils/canvasUtils';

import { ToastType } from '../../types';

interface PicTalkTabProps {
  onLoading: (show: boolean, text?: string) => void;
  onToast: (message: string, type: ToastType) => void;
}

const PicTalkTab: React.FC<PicTalkTabProps> = ({ onLoading, onToast }) => {
  const [image, setImage] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState("Kore");
  const [style, setStyle] = useState("Natural");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0); // Simulated via playbackRate mostly, or just UI for now
  const [volume, setVolume] = useState(1.0);
  const [numOutputs, setNumOutputs] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const voiceOptions = [
    { label: 'Kore (Female - Natural)', value: 'Kore' },
    { label: 'Puck (Male - Soft)', value: 'Puck' },
    { label: 'Zephyr (Male - Professional)', value: 'Zephyr' },
    { label: 'Fenrir (Male - Deep)', value: 'Fenrir' },
    { label: 'Charon (Male - Authoritative)', value: 'Charon' },
  ];

  const styleOptions = [
    { label: 'Natural (Default)', value: 'Natural' },
    { label: 'Excited (Bersemangat)', value: 'Excitedly' },
    { label: 'Calm (Tenang)', value: 'Calmly' },
    { label: 'Cheerful (Ceria)', value: 'Cheerfully' },
    { label: 'Professional (Formal)', value: 'Professionally' },
    { label: 'Dramatic (Dramatis)', value: 'Dramatically' },
    { label: 'Whispering (Berbisik)', value: 'Whispering' },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = volume;
      // Pitch is not directly supported by HTML Audio Element without Web Audio API
      // However, changing playbackRate also changes pitch usually, unless preservePitch is true (default)
      // To simulate pitch change with speed, we'd need to disable preservePitch, but it's browser dependent.
      // For now, let's stick to speed and volume which are reliable.
      // We can use 'mozPreservePitch' or 'webkitPreservePitch' if needed, but standard is 'preservesPitch'
      if (audioRef.current.preservesPitch !== undefined) {
        audioRef.current.preservesPitch = pitch === 1.0; 
      }
    }
  }, [speed, volume, pitch, audioUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImage(null);
    }
    
    // Clear input value to allow re-uploading the same file
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!image) return;
    onLoading(true, "Analyzing image & writing script...");
    try {
      const prompt = `
        Analyze this image and write a short, engaging, and natural narration script (3-4 sentences).
        The script should be in the first-person perspective of someone in the scene or describing the scene with emotion.
        Make it sound like a real person talking.
        Return ONLY the script text.
      `;
      const text = await analyzeImage(prompt, [image]);
      setScript(text || "");
    } catch (err: any) {
      onToast(err?.message || "Analysis failed.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) return;
    onLoading(true, "Generating AI Voice Over...");
    try {
      // Generate audio based on numOutputs
      const generationPromises = Array.from({ length: numOutputs }, () =>
        generateSpeech(script, voice, style)
      );
      
      const pcmDatas = await Promise.all(generationPromises);
      
      const urls = pcmDatas.filter(Boolean).map(pcmData => {
        const buffer = base64ToArrayBuffer(pcmData!);
        const wav = pcmToWav(buffer, 24000);
        return URL.createObjectURL(wav);
      });
      
      setAudioUrls(urls);
      setAudioUrl(urls[0] || null);
    } catch (err: any) {
      onToast(err?.message || "Speech generation failed.", ToastType.ERROR);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 min-h-full pb-24">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 mb-2 md:mb-4 tracking-tight">
          AI PicTalk
        </h2>
        <div className="flex items-center gap-2 max-w-2xl mx-auto p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-left">
          <Mic size={16} className="text-emerald-500 shrink-0" />
          <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400">
            let your images speak and speech. analyze scenes for scripts and generate natural AI narration instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Panel: Voice Settings & Controls */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 h-full flex flex-col">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Headphones size={18} className="text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">Voice Settings</h3>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Voice</label>
                <select 
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                >
                  {voiceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Speaking Style</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                >
                  {styleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Speed Control */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Gauge size={12} /> Speed</span>
                  <span>{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Pitch Control (Simulated/Placeholder) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Activity size={12} /> Pitch</span>
                  <span>{pitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Volume2 size={12} /> Volume</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Output (Max 2) ({numOutputs})</label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  value={numOutputs}
                  onChange={(e) => setNumOutputs(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={handleGenerateAudio}
                disabled={!script}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Headphones size={18} /> Generate Audio
              </button>
              <button 
                onClick={() => { 
                  setScript(""); 
                  setImage(null); 
                  setAudioUrl(null); 
                  setAudioUrls([]);
                  setSpeed(1.0); 
                  setPitch(1.0); 
                  setVolume(1.0); 
                  setStyle("Natural");
                }}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RefreshCw size={18} /> Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Upload, Script & Result */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-xl space-y-6 h-full flex flex-col">
            
            {/* Upload Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase flex justify-between">
                <span>1. Upload Scene (Optional)</span>
                {image && <button onClick={() => setImage(null)} className="text-red-500 hover:underline">Remove</button>}
              </label>
              <div 
                className={`w-full transition-all relative overflow-hidden group rounded-2xl border-2 border-dashed ${image ? 'h-64 border-emerald-500/50' : 'h-32 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
                onClick={() => !image && document.getElementById('talk-upload')?.click()}
              >
                {image ? (
                  <img src={image} className="w-full h-full object-contain bg-slate-900" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2 text-emerald-500">
                      <UserPlus size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-400">Click to upload image</span>
                  </div>
                )}
                <input id="talk-upload" type="file" className="hidden" onChange={handleFile} accept="image/*" />
              </div>
              {image && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs border border-emerald-100 dark:border-emerald-800 flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Wand2 size={14} /> Generate Script from Image
                </button>
              )}
            </div>

            {/* Script Section */}
            <div className="space-y-3 flex-1 flex flex-col">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">2. Narration Script</label>
              <textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Type your script here or generate from image..."
                className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none flex-1 min-h-[150px] resize-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* Audio Result Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase mb-3 block">3. Generated Audio</label>
              
              {!audioUrls.length ? (
                <div className="h-28 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Headphones size={18} className="opacity-50" />
                  </div>
                  <span className="text-xs font-medium">Audio output will appear here</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {audioUrls.map((url, i) => (
                    <div key={i} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shrink-0">
                        <Mic size={24} />
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Audio Variation {i + 1}</h4>
                          <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700">
                            {voice} • {style}
                          </span>
                        </div>
                        <audio 
                          controls 
                          src={url} 
                          className="w-full h-8 accent-emerald-500" 
                        />
                      </div>
                      <a 
                        href={url} 
                        download={`narration-${voice}-${style}-${i + 1}.wav`}
                        className="p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                        title="Download Audio"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PicTalkTab;
