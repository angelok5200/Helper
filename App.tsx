import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { sendMessageStream, generateFinalBlueprint } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import TypingIndicator from './components/TypingIndicator';
import { SendIcon, SparklesIcon, HammerIcon, MicIcon, StopCircleIcon } from './components/Icons';
import BlueprintModal from './components/BlueprintModal';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // STT State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionLang, setRecognitionLang] = useState('uk-UA'); // Default to Ukrainian
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, interimTranscript]);

  useEffect(() => {
    // Initial greeting if empty
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        content: `**Привіт! Hello!** 👋\n\nI am your App Architect. Я ваш архітектор застосунків.\n\nI can help you refine your idea, **compare technologies** (e.g., React vs Vue), and design your system.\n\nРозкажіть про свою ідею або запитайте про порівняння технологій, щоб обрати найкращий стек.`
      }]);
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (contentOverride?: string) => {
    const textToSend = typeof contentOverride === 'string' ? contentOverride : input;
    
    if (!textToSend.trim() || isLoading) return;

    if (isListening) {
      stopListening(); 
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setInterimTranscript('');
    setIsLoading(true);

    try {
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        content: '',
        isStreaming: true
      }]);

      let fullText = '';
      
      await sendMessageStream(userMsg.content, (chunk) => {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, content: fullText }
            : msg
        ));
      });

      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "**Error:** Something went wrong connecting to the Architect. Please check your API Key configuration."
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleGenerateBlueprint = async () => {
    if (messages.length < 3) return;
    setIsGeneratingBlueprint(true);
    
    try {
      const result = await generateFinalBlueprint(messages);
      setBlueprint(result);
      setIsModalOpen(true);
    } catch (e) {
      alert("Failed to generate blueprint. Please try again.");
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (!navigator.onLine) {
        alert("Voice input requires an active internet connection.");
        return;
    }

    // Stop existing instance if any
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = recognitionLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      // Check if user still wants to listen
      if (shouldListenRef.current) {
         // Small delay to prevent rapid restart loops that browsers might block
         setTimeout(() => {
           if (shouldListenRef.current) {
             try {
               recognition.start();
             } catch (e) {
               console.warn("Failed to restart recognition:", e);
               setIsListening(false);
               shouldListenRef.current = false;
             }
           }
         }, 150);
      } else {
        setIsListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
        alert("Microphone access denied.");
      } else if (event.error === 'network') {
        // Network error - usually fatal for the session
        shouldListenRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
        alert("Network error: Voice input service is unreachable. Please check your connection.");
      }
      // 'no-speech' is ignored here, caught by onend to restart
    };

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      let interimTranscriptChunk = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        } else {
          interimTranscriptChunk += event.results[i][0].transcript;
        }
      }

      if (finalTranscriptChunk) {
         setInput(prev => {
             const spacer = (prev.length > 0 && !prev.endsWith(' ')) ? ' ' : '';
             return prev + spacer + finalTranscriptChunk;
         });
      }
      
      setInterimTranscript(interimTranscriptChunk);
    };

    shouldListenRef.current = true;
    try {
      recognition.start();
    } catch(e) {
      console.error("Start failed", e);
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 font-sans">
      
      {/* Header */}
      <header className="flex-none px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <SparklesIcon className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">App Architect AI</h1>
            <p className="text-xs text-slate-400">Consultant & Prompt Engineer</p>
          </div>
        </div>

        {messages.length > 2 && (
          <button
            onClick={handleGenerateBlueprint}
            disabled={isGeneratingBlueprint || isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${isGeneratingBlueprint 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isGeneratingBlueprint ? (
              <span className="flex items-center gap-2">
                 <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                 Architecting...
              </span>
            ) : (
              <>
                <HammerIcon />
                <span>Build Blueprint</span>
              </>
            )}
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/50">
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-slate-900 border-t border-slate-800">
        {/* Suggestion Chips */}
        {messages.length < 5 && !isLoading && (
          <div className="max-w-4xl mx-auto mb-3 flex gap-2 overflow-x-auto no-scrollbar mask-gradient pb-1">
            <button 
              onClick={() => handleSend("Compare React vs Vue vs Angular")}
              className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors whitespace-nowrap"
            >
              VS React vs Vue vs Angular
            </button>
            <button 
              onClick={() => handleSend("Python vs Node.js for Backend")}
              className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors whitespace-nowrap"
            >
              VS Python vs Node.js
            </button>
            <button 
              onClick={() => handleSend("Best tech stack for MVP?")}
              className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors whitespace-nowrap"
            >
              🚀 Best stack for MVP
            </button>
             <button 
              onClick={() => handleSend("Порадь стек для e-commerce")}
              className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full text-xs md:text-sm transition-colors whitespace-nowrap"
            >
              🛍️ Stack for E-commerce
            </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto relative">
          <div className="relative">
             <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... (Говоріть...)" : "Describe your app idea here... (Опишіть ідею вашого застосунку)"}
              className={`
                w-full bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-2xl pl-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none shadow-xl transition-all
                ${isListening ? 'ring-2 ring-red-500/50 border-red-500 shadow-red-900/20' : ''}
              `}
              style={{ paddingRight: '160px', minHeight: '60px', maxHeight: '200px' }}
              rows={1}
            />
            {/* Interim Transcript Overlay / Feedback */}
            {isListening && interimTranscript && (
              <div className="absolute left-5 bottom-[-1.5rem] text-sm text-emerald-400 truncate max-w-[70%] animate-pulse">
                ... {interimTranscript}
              </div>
            )}
          </div>
          
          <div className="absolute right-3 bottom-3 flex gap-2 items-center">
            {/* Language Selector */}
            <select
              value={recognitionLang}
              onChange={(e) => setRecognitionLang(e.target.value)}
              disabled={isListening}
              className="h-10 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl px-2 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer disabled:opacity-50"
            >
              <option value="uk-UA">UA</option>
              <option value="en-US">EN</option>
            </select>

            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`
                p-2.5 rounded-xl transition-all
                ${isListening 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 animate-pulse' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isListening ? "Stop Recording" : "Start Voice Input"}
            >
              {isListening ? <StopCircleIcon /> : <MicIcon />}
            </button>

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`
                p-2.5 rounded-xl transition-all
                ${!input.trim() || isLoading 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/25'
                }
              `}
            >
              <SendIcon />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          AI can make mistakes. Review generated blueprints carefully.
        </p>
      </footer>

      <BlueprintModal 
        content={blueprint || ''} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}

export default App;