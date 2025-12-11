import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

interface BlueprintModalProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

const BlueprintModal: React.FC<BlueprintModalProps> = ({ content, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 rounded-t-xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400">⚡</span> Master Development Prompt
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
          >
            Close
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
           <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
             {content}
           </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
          <button 
            onClick={handleCopy}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
              ${copied 
                ? 'bg-green-600 text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/25'
              }
            `}
          >
            {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy Blueprint</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BlueprintModal;