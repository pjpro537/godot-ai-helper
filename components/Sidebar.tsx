import React from 'react';
import { Box, Play, BrainCircuit, Bug, MessageSquare, Code2, Image as ImageIcon } from 'lucide-react';
import { ToolMode } from '../types';

interface SidebarProps {
  currentMode: ToolMode;
  setMode: (mode: ToolMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: ToolMode.CODE_GEN, icon: Code2, label: 'Generator' },
    { mode: ToolMode.ASSET_GEN, icon: ImageIcon, label: 'Assets' },
    { mode: ToolMode.PHYSICS, icon: Box, label: 'Physics' },
    { mode: ToolMode.LOGIC, icon: BrainCircuit, label: 'Logic' },
    { mode: ToolMode.DEBUGGER, icon: Bug, label: 'Debug' },
    { mode: ToolMode.CHAT, icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <div className="w-full md:w-24 lg:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col shrink-0 backdrop-blur-md z-20">
      {/* Header / Logo */}
      <div className="h-16 md:h-24 flex items-center justify-center md:justify-start md:px-8 border-b border-white/5">
        <div className="relative group">
            <div className="absolute -inset-2 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Play className="text-white fill-white ml-0.5" size={14} />
            </div>
        </div>
        <div className="hidden lg:flex flex-col ml-4">
            <span className="text-white font-semibold text-lg tracking-tight">Architect</span>
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-medium">Godot 4 AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex md:flex-col items-center md:items-stretch justify-around md:justify-start py-2 md:py-8 space-x-0 md:space-x-0 md:space-y-2 px-2 md:px-4">
        {navItems.map((item) => {
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`relative flex flex-col md:flex-row items-center p-3 md:px-4 md:py-3.5 rounded-xl transition-all duration-300 group outline-none ${
                isActive 
                  ? 'bg-white/10 text-white shadow-lg shadow-black/20' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon 
                size={22} 
                strokeWidth={1.5}
                className={`transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-105'}`} 
              />
              <span className={`text-[10px] md:text-sm mt-1 md:mt-0 md:ml-4 font-medium transition-colors ${isActive ? 'text-white' : ''}`}>
                  {item.label}
              </span>
              
              {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)] hidden md:block"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="hidden md:flex flex-col p-6 md:p-8 border-t border-white/5 opacity-50">
        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Powered By</div>
        <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-medium text-white">Gemini 3 Pro</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;