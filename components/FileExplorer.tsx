import React, { useState } from 'react';
import { ProjectFile } from '../types';
import { FileCode, FileJson, Plus, Trash2, Code2, FolderOpen } from 'lucide-react';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFileId: string;
  onFileSelect: (id: string) => void;
  onFileCreate: (name: string) => void;
  onFileDelete: (id: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileId, onFileSelect, onFileCreate, onFileDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 h-full bg-black/20 border-r border-white/5 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center space-x-2 text-white/60">
            <FolderOpen size={16} className="text-blue-400"/>
            <span className="text-xs font-semibold tracking-wide uppercase">Project</span>
         </div>
         <button 
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
         >
            <Plus size={16} />
         </button>
      </div>

      {/* Creating Input */}
      {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-3 border-b border-white/5 bg-white/5">
              <input 
                autoFocus
                type="text" 
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="script_name.gd"
                className="w-full bg-black/40 border border-blue-500/50 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none"
                onBlur={() => { if(!newFileName) setIsCreating(false); }}
              />
          </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {files.map(file => (
          <div 
            key={file.id}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeFileId === file.id 
                ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => onFileSelect(file.id)}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
                 {file.name.endsWith('.json') ? <FileJson size={14} className="opacity-70" /> : <FileCode size={14} className="opacity-70" />}
                 <span className="text-xs font-medium truncate">{file.name}</span>
            </div>
            
            {/* Delete button only shows on hover and if more than 1 file exists */}
            {files.length > 1 && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onFileDelete(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-all"
                >
                    <Trash2 size={12} />
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;