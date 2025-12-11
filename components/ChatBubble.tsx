import React from 'react';
import { Message } from '../types';
import { BotIcon, UserIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border shadow-lg ${
          isUser 
            ? 'bg-indigo-600 border-indigo-400 text-white' 
            : 'bg-emerald-600 border-emerald-400 text-white'
        }`}>
          {isUser ? <UserIcon /> : <BotIcon />}
        </div>

        {/* Content */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base break-words w-full
            ${isUser 
              ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50 rounded-tr-none' 
              : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
            }
          `}>
             <MarkdownRenderer content={message.content} />
          </div>
          <span className="text-xs text-slate-500 mt-1 px-1">
             {isUser ? 'You' : 'Architect AI'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;