import React from 'react';
import { BotIcon } from './Icons';

const TypingIndicator = () => {
  return (
    <div className="flex w-full mb-6 justify-start animate-fade-in">
      <div className="flex max-w-[80%] gap-3 flex-row">
        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-emerald-400 bg-emerald-600 text-white shadow-lg">
          <BotIcon />
        </div>
        <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700 flex items-center gap-1 h-12">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;