import React, { useRef } from 'react';
import { Copy, Check, X, Download } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  readOnly?: boolean;
  generatedImageUrl?: string | null;
  onClearImage?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, readOnly = false, generatedImageUrl, onClearImage }) => {
  const [copied, setCopied] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5 mr-4 group">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner opacity-70 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-white/30 font-mono tracking-wide">{generatedImageUrl ? 'asset_preview.png' : 'script.gd'}</span>
            </div>
        </div>
        
        {!generatedImageUrl && (
            <button 
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs font-medium text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5"
            >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
        )}
      </div>
      
      {/* Editor Area */}
      <div className="relative flex-1 overflow-hidden">
        {generatedImageUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-sm z-20 animate-in fade-in duration-300">
                <div className="relative max-w-full max-h-full p-2 border border-white/10 rounded-xl bg-white/5 shadow-2xl">
                    <img src={generatedImageUrl} alt="Generated Asset" className="max-w-full max-h-[70vh] rounded-lg object-contain" />
                    <button 
                        onClick={onClearImage}
                        className="absolute -top-3 -right-3 p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="mt-6 flex space-x-4">
                    <a 
                        href={generatedImageUrl} 
                        download="generated_asset.png"
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Download size={16} />
                        <span>Download Asset</span>
                    </a>
                </div>
            </div>
        ) : (
            <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={readOnly}
            className="w-full h-full p-6 md:p-8 bg-transparent text-[#e0e0e0] font-mono text-sm resize-none focus:outline-none leading-loose custom-scrollbar selection:bg-blue-500/30 selection:text-white"
            placeholder="# Output will appear here..."
            spellCheck={false}
            style={{
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.5px'
            }}
            />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;