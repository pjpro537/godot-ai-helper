import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Tools from './components/Tools';
import FileExplorer from './components/FileExplorer';
import { ToolMode, ProjectFile } from './types';
import { chatWithGemini } from './services/gemini';
import { Send, User, Bot, Sparkles, Undo2, Redo2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const simpleId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_CODE = `extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0

var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

func _physics_process(delta):
\tif not is_on_floor():
\t\tvelocity.y += gravity * delta

\tif Input.is_action_just_pressed("ui_accept") and is_on_floor():
\t\tvelocity.y = JUMP_VELOCITY

\tvar direction = Input.get_axis("ui_left", "ui_right")
\tif direction:
\t\tvelocity.x = direction * SPEED
\telse:
\t\tvelocity.x = move_toward(velocity.x, 0, SPEED)

\tmove_and_slide()
`;

const INITIAL_FILES: ProjectFile[] = [
    { id: '1', name: 'player.gd', language: 'gdscript', content: INITIAL_CODE },
    { id: '2', name: 'game_manager.gd', language: 'gdscript', content: 'extends Node\n\nvar score: int = 0\n' }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>(ToolMode.CODE_GEN);
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [explanation, setExplanation] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Undo/Redo History
  const [history, setHistory] = useState<ProjectFile[][]>([INITIAL_FILES]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Chat State
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hello. I am your Godot Architect. I can see all your project files. How can I assist you?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const pushToHistory = (newFiles: ProjectFile[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newFiles);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setFiles(newFiles);
  };

  const undo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setFiles(history[newIndex]);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setFiles(history[newIndex]);
      }
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const updateActiveFileContent = (newContent: string) => {
    const updatedFiles = files.map(f => f.id === activeFileId ? { ...f, content: newContent } : f);
    pushToHistory(updatedFiles);
  };

  const handleFileCreate = (name: string) => {
      const newFile: ProjectFile = {
          id: simpleId(),
          name,
          language: name.endsWith('.json') ? 'json' : 'gdscript',
          content: name.endsWith('.json') ? '{}' : 'extends Node\n'
      };
      const updatedFiles = [...files, newFile];
      pushToHistory(updatedFiles);
      setActiveFileId(newFile.id);
  };

  const handleFileDelete = (id: string) => {
      if (files.length <= 1) return;
      const updatedFiles = files.filter(f => f.id !== id);
      pushToHistory(updatedFiles);
      if (activeFileId === id) setActiveFileId(updatedFiles[0].id);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
        const responseText = await chatWithGemini(chatHistory, chatInput, files, activeFileId);
        const modelMsg = { role: 'model' as const, content: responseText || "I couldn't generate a response." };
        setChatHistory(prev => [...prev, modelMsg]);
    } catch (err) {
        setChatHistory(prev => [...prev, { role: 'model', content: "Error communicating with Gemini." }]);
    } finally {
        setChatLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 md:p-8">
      {/* Main Glass Container */}
      <div className="w-full h-full max-w-[1800px] glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Navigation Rail */}
        <Sidebar currentMode={mode} setMode={setMode} />
        
        {/* Content Area */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Left Panel: Tools or Chat */}
          <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative z-10 bg-black/20">
              {mode === ToolMode.CHAT ? (
                  // Chat Interface
                  <div className="flex flex-col h-full">
                      <div className="p-6 md:p-8 border-b border-white/5">
                          <h2 className="text-2xl font-light text-white flex items-center tracking-tight">
                              <Sparkles className="text-blue-400 mr-3 opacity-80" size={20}/>
                              Assistant
                          </h2>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          {chatHistory.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-md ${
                                      msg.role === 'user' 
                                      ? 'bg-blue-600/30 text-white border border-blue-500/30' 
                                      : 'bg-white/5 text-gray-200 border border-white/5'
                                  }`}>
                                      <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-bold uppercase tracking-widest">
                                          {msg.role === 'user' ? "You" : "Architect"}
                                      </div>
                                      <div className="whitespace-pre-wrap font-light">{msg.content}</div>
                                  </div>
                              </div>
                          ))}
                           {chatLoading && (
                              <div className="flex justify-start">
                                  <div className="bg-white/5 rounded-2xl px-5 py-3 text-sm text-gray-400 animate-pulse border border-white/5">
                                      Processing...
                                  </div>
                              </div>
                           )}
                      </div>
                      <form onSubmit={handleChatSubmit} className="p-6 border-t border-white/5 bg-black/10 backdrop-blur-sm">
                          <div className="relative group">
                              <input
                                  type="text"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  placeholder="Ask about your project..."
                                  className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder-white/20"
                              />
                              <button 
                                  type="submit"
                                  disabled={chatLoading}
                                  className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                              >
                                  <Send size={18} />
                              </button>
                          </div>
                      </form>
                  </div>
              ) : (
                  // Tools Interface
                  <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                          <Tools 
                              mode={mode} 
                              projectFiles={files}
                              activeFileId={activeFileId}
                              onCodeUpdate={(code) => {
                                  updateActiveFileContent(code);
                                  setGeneratedImage(null); // Clear image if code is generated
                              }}
                              onExplanation={setExplanation}
                              onImageGenerated={setGeneratedImage}
                          />
                      </div>
                      
                      {/* Explanation Panel */}
                      {explanation && (
                           <div className="h-1/3 border-t border-white/5 bg-black/30 backdrop-blur-md p-6 overflow-y-auto">
                               <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 opacity-80">Insight</h3>
                               <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light leading-relaxed">
                                   {explanation}
                               </div>
                           </div>
                      )}
                  </div>
              )}
          </div>

          {/* Project Explorer & Editor Wrapper */}
          <div className="flex-1 flex overflow-hidden">
             <FileExplorer 
                files={files} 
                activeFileId={activeFileId} 
                onFileSelect={(id) => {
                    setActiveFileId(id);
                    setGeneratedImage(null);
                }} 
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
            />

            {/* Right Panel: Code Editor */}
            <div className="flex-1 h-full flex flex-col bg-[#0d0e12]/80 relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none"></div>
                 <div className="absolute top-4 right-4 z-20 flex space-x-2">
                     <button onClick={undo} disabled={historyIndex <= 0} className="p-2 bg-black/40 text-white/70 hover:text-white rounded-lg disabled:opacity-30 border border-white/5 hover:bg-white/10 transition-all">
                        <Undo2 size={16} />
                     </button>
                     <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 bg-black/40 text-white/70 hover:text-white rounded-lg disabled:opacity-30 border border-white/5 hover:bg-white/10 transition-all">
                        <Redo2 size={16} />
                     </button>
                 </div>
                 <CodeEditor 
                    code={activeFile.content} 
                    setCode={updateActiveFileContent}
                    generatedImageUrl={generatedImage}
                    onClearImage={() => setGeneratedImage(null)}
                 />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;