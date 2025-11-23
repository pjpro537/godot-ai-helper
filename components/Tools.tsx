import React, { useState, useRef } from 'react';
import { ToolMode, GodotContextType, GenerationConfig, ProjectFile, AssetOutputMode } from '../types';
import { generateGodotCode, generateVisualAsset, analyzeError } from '../services/gemini';
import { Loader2, Wand2, RefreshCw, Layers, Cuboid, Monitor, FileCode, FileText, Settings, Sliders, ChevronDown, ChevronUp, ImagePlus, X, Sparkles, Image as ImageIcon, ScrollText, Zap, Box, Gamepad2, Database, Palette, Droplet } from 'lucide-react';

interface ToolsProps {
  mode: ToolMode;
  projectFiles: ProjectFile[];
  activeFileId: string;
  onCodeUpdate: (code: string) => void;
  onExplanation: (text: string) => void;
  onImageGenerated: (url: string) => void;
}

const Tools: React.FC<ToolsProps> = ({ mode, projectFiles, activeFileId, onCodeUpdate, onExplanation, onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [referenceInput, setReferenceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorInput, setErrorInput] = useState('');
  const [godotContext, setGodotContext] = useState<GodotContextType>('2D');
  const [assetOutputMode, setAssetOutputMode] = useState<AssetOutputMode>('script');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    creativity: 0.5,
    verbosity: 'standard',
    typing: 'strict',
    architecture: 'default'
  });

  const currentFile = projectFiles.find(f => f.id === activeFileId);

  const handleAction = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() && mode !== ToolMode.DEBUGGER && !referenceInput.trim() && !selectedImage) return;
    setLoading(true);
    onExplanation(''); 

    try {
        let rawBase64 = undefined;
        if (selectedImage) {
            rawBase64 = selectedImage.split(',')[1];
        }

        // Handle Image Generation (Visual Asset)
        if (mode === ToolMode.ASSET_GEN && assetOutputMode === 'image') {
            const effectivePrompt = finalPrompt || "A high quality game asset.";
            const imageUrl = await generateVisualAsset(effectivePrompt, rawBase64);
            onImageGenerated(imageUrl);
            onExplanation(`Generated visual asset based on: ${effectivePrompt}`);
        } 
        // Handle Code/Script Generation
        else {
            let result;
            if (mode === ToolMode.DEBUGGER) {
                 const analysis = await analyzeError(errorInput || finalPrompt, currentFile?.content || '');
                 onExplanation(analysis || 'No analysis returned.');
            } else {
                let genMode: 'physics' | 'logic' | 'general' | 'asset' = 'general';
                if (mode === ToolMode.PHYSICS) genMode = 'physics';
                else if (mode === ToolMode.LOGIC) genMode = 'logic';
                else if (mode === ToolMode.ASSET_GEN) genMode = 'asset';
                
                let effectivePrompt = finalPrompt;
                if (!effectivePrompt && referenceInput) effectivePrompt = "Replicate the functionality of the reference material in Godot 4.";
                if (!effectivePrompt && selectedImage) effectivePrompt = "Analyze this image and create the corresponding Godot 4 assets/scripts.";
                
                result = await generateGodotCode(
                    effectivePrompt, 
                    projectFiles,
                    activeFileId,
                    genMode, 
                    godotContext, 
                    referenceInput, 
                    config, 
                    rawBase64
                );
    
                if (result) {
                    onCodeUpdate(result.code);
                    onExplanation(result.explanation);
                }
            }
        }
    } catch (e) {
      onExplanation(`Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const placeholders = {
    [ToolMode.CODE_GEN]: "Describe the script you want to create...",
    [ToolMode.ASSET_GEN]: assetOutputMode === 'script' ? "Describe procedural mesh/object logic..." : "Describe the texture, sprite, or model look...",
    [ToolMode.PHYSICS]: "Describe physics behavior...",
    [ToolMode.LOGIC]: "Describe game logic...",
    [ToolMode.DEBUGGER]: "Paste your stack trace...",
  };

  const contextOptions: { type: GodotContextType; icon: React.ElementType; label: string }[] = [
    { type: '2D', icon: Layers, label: '2D' },
    { type: '3D', icon: Cuboid, label: '3D' },
    { type: 'UI', icon: Monitor, label: 'UI' },
    { type: 'Logic', icon: FileCode, label: 'Code' },
  ];

  if (mode === ToolMode.CHAT) return null;

  return (
    <div className="h-full flex flex-col p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-light text-white tracking-tight flex items-center">
            {mode === ToolMode.PHYSICS && "Physics"}
            {mode === ToolMode.LOGIC && "Logic"}
            {mode === ToolMode.CODE_GEN && "Script"}
            {mode === ToolMode.ASSET_GEN && "Assets"}
            {mode === ToolMode.DEBUGGER && "Debugger"}
            {mode !== ToolMode.DEBUGGER && <span className="ml-2 opacity-30 font-thin">Engine</span>}
        </h2>
        {mode !== ToolMode.DEBUGGER && (
             <div className="flex items-center space-x-2 text-white/40 font-light text-sm">
                 <FileCode size={14} className="text-blue-400"/>
                 <span>Editing: <span className="text-white/80 font-medium">{currentFile?.name}</span></span>
            </div>
        )}
      </div>

      {/* Mode Selection (Asset Gen Only) */}
      {mode === ToolMode.ASSET_GEN && (
         <div className="bg-white/5 p-1 rounded-xl flex">
            <button 
                onClick={() => setAssetOutputMode('script')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-medium transition-all ${assetOutputMode === 'script' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
                <ScrollText size={14} />
                <span>Procedural Script</span>
            </button>
            <button 
                onClick={() => setAssetOutputMode('image')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-medium transition-all ${assetOutputMode === 'image' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
                <ImageIcon size={14} />
                <span>Visual Asset</span>
            </button>
         </div>
      )}

      {mode !== ToolMode.DEBUGGER && mode !== ToolMode.ASSET_GEN && (
        <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Target Context</label>
            <div className="grid grid-cols-4 gap-3">
                {contextOptions.map((opt) => (
                    <button
                        key={opt.type}
                        onClick={() => setGodotContext(opt.type)}
                        className={`group relative flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                            godotContext === opt.type
                                ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                         <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent`}></div>
                        <opt.icon size={20} strokeWidth={1.5} className="mb-2 z-10" />
                        <span className="text-[11px] font-medium z-10">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Inputs Section */}
      <div className="space-y-6">
          
        {/* Debugger Input */}
        {mode === ToolMode.DEBUGGER && (
            <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Stack Trace</label>
                <textarea
                    value={errorInput}
                    onChange={(e) => setErrorInput(e.target.value)}
                    placeholder="Paste Error Log here..."
                    className="w-full h-32 input-glass rounded-2xl p-4 text-sm text-gray-200 focus:outline-none resize-none font-mono placeholder-white/20"
                />
            </div>
        )}

        {/* Asset Gen Image */}
        {mode === ToolMode.ASSET_GEN && (
             <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Reference Visual</label>
                <div 
                    className={`relative w-full border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 group overflow-hidden ${
                        selectedImage ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                >
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    
                    {selectedImage ? (
                        <div className="relative w-full flex justify-center z-10">
                             <img src={selectedImage} alt="Reference" className="max-h-40 rounded-lg shadow-2xl" />
                             <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedImage(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="absolute -top-2 -right-2 bg-black/50 backdrop-blur text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"
                             >
                                <X size={12} />
                             </button>
                        </div>
                    ) : (
                        <div className="text-center text-white/40 group-hover:text-white/60 transition-colors">
                             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-white/5">
                                 <ImagePlus size={20} />
                             </div>
                             <span className="text-sm font-medium">Drop Reference Image</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Reference Code */}
        {mode !== ToolMode.DEBUGGER && (
            <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {mode === ToolMode.ASSET_GEN ? "Specifics" : "Context / Reference"}
                    </label>
                </div>
                <textarea
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder={mode === ToolMode.ASSET_GEN ? "E.g. 'Cyberpunk aesthetic, neon lights...'" : "Paste Unity/Unreal code or documentation..."}
                    className="w-full h-20 input-glass rounded-2xl p-4 text-sm text-gray-200 focus:outline-none resize-none font-mono placeholder-white/20"
                />
            </div>
        )}

        {/* Main Instruction */}
        <div className="space-y-3">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">
                {mode === ToolMode.DEBUGGER ? "Context" : "Prompt"}
            </label>
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={placeholders[mode]}
                    className="w-full h-32 input-glass rounded-2xl p-4 text-sm text-gray-200 focus:outline-none resize-none placeholder-white/20"
                />
                <div className="absolute bottom-3 right-3">
                     <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-all ${showSettings ? 'text-blue-400 bg-blue-500/10' : 'text-white/30 hover:text-white'}`}
                        title="Configuration"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>
        </div>

        {/* Configuration Panel (Collapsible) */}
        {showSettings && (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Conservative</span>
                        <span>Creative</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1"
                        value={config.creativity}
                        onChange={(e) => setConfig({...config, creativity: parseFloat(e.target.value)})}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Typing</label>
                        <select 
                            value={config.typing}
                            onChange={(e) => setConfig({...config, typing: e.target.value as any})}
                            className="w-full bg-black/30 border border-white/10 text-gray-300 text-xs rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="strict">Strict</option>
                            <option value="dynamic">Dynamic</option>
                        </select>
                    </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Comments</label>
                        <select 
                            value={config.verbosity}
                            onChange={(e) => setConfig({...config, verbosity: e.target.value as any})}
                            className="w-full bg-black/30 border border-white/10 text-gray-300 text-xs rounded-lg p-2.5 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="standard">Standard</option>
                            <option value="educational">Educational</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                </div>
            </div>
        )}

        <button
          onClick={() => handleAction()}
          disabled={loading || ((!prompt && !referenceInput && !selectedImage) && mode !== ToolMode.DEBUGGER)}
          className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-2 font-medium transition-all duration-300 text-sm tracking-wide
            ${loading 
                ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className={mode === ToolMode.DEBUGGER ? "" : "fill-white/20"} />
              <span>{mode === ToolMode.DEBUGGER ? "Analyze" : (mode === ToolMode.ASSET_GEN && assetOutputMode === 'image' ? "Generate Image" : "Generate Code")}</span>
            </>
          )}
        </button>
      </div>

      {/* Smart Library / Behavior Injector */}
      {mode !== ToolMode.DEBUGGER && (
         <div className="pt-2">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 pl-1 flex items-center">
                <Zap size={12} className="mr-1.5" />
                {mode === ToolMode.ASSET_GEN && assetOutputMode === 'image' ? "Smart Styles" : "Behavior Library"}
            </h3>
            
            <div className="space-y-4">
                {/* Visual Modifiers */}
                {mode === ToolMode.ASSET_GEN && assetOutputMode === 'image' ? (
                    <div className="grid grid-cols-2 gap-3">
                        <ActionCard icon={Palette} title="Pixel Art" desc="Retro 8-bit style" onClick={() => handleAction("Generate a pixel art version of this prompt, 8-bit style.")} />
                        <ActionCard icon={Palette} title="Cyberpunk" desc="Neon, dark, high contrast" onClick={() => handleAction("Generate a cyberpunk, neon-lit version of this.")} />
                        <ActionCard icon={Palette} title="Vaporwave" desc="Soft pinks and blues" onClick={() => handleAction("Generate a vaporwave aesthetic version.")} />
                        <ActionCard icon={Palette} title="Hand Drawn" desc="Sketchy, pencil style" onClick={() => handleAction("Generate a hand-drawn sketch style version.")} />
                    </div>
                ) : (
                    // Code Modifiers
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Movement */}
                            <ActionCard 
                                icon={Gamepad2} 
                                title="Movement" 
                                desc="Platformer, Top-down..." 
                                onClick={() => handleAction("Inject robust movement logic into the current script. If 2D, add platformer physics (gravity, jump). If 3D, add CharacterBody3D movement.")} 
                            />
                            {/* Combat */}
                            <ActionCard 
                                icon={Box} 
                                title="Health System" 
                                desc="HP, Damage, Death" 
                                onClick={() => handleAction("Add a complete Health system to this script. Include 'health' variable, 'take_damage' function, and a 'died' signal.")} 
                            />
                            {/* State */}
                            <ActionCard 
                                icon={Layers} 
                                title="State Machine" 
                                desc="Idle, Run, Jump" 
                                onClick={() => handleAction("Refactor this script to use a simple Enum-based State Machine (IDLE, RUN, JUMP, etc) for better logic management.")} 
                            />
                            {/* Inventory */}
                            <ActionCard 
                                icon={Database} 
                                title="Inventory" 
                                desc="Array-based storage" 
                                onClick={() => handleAction("Add a simple inventory system using an Array. Include 'add_item', 'remove_item' functions.")} 
                            />
                        </div>
                        
                        {/* Tweaks */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <Chip label="Double Speed" onClick={() => handleAction("Modify the movement constants to double the speed.")} />
                            <Chip label="Fix Gravity" onClick={() => handleAction("Ensure gravity application logic is correct using ProjectSettings.")} />
                            <Chip label="Add Comments" onClick={() => handleAction("Add detailed comments to the existing code explaining every function.")} />
                            <Chip label="Optimize" onClick={() => handleAction("Optimize the existing code for performance and readability.")} />
                        </div>
                    </>
                )}
            </div>
         </div>
      )}
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl transition-all group text-left"
    >
        <div className="flex items-center space-x-2 mb-1">
            <Icon size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-xs font-medium text-gray-200 group-hover:text-white">{title}</span>
        </div>
        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">{desc}</span>
    </button>
);

const Chip = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full text-[10px] text-gray-400 hover:text-white transition-all whitespace-nowrap"
    >
        {label}
    </button>
);

export default Tools;