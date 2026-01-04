
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Send, Sparkles, Brain, Clock, PlusCircle, Terminal, Info, Copy, Check } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';

/**
 * Enhanced Markdown-like parser for a more professional tutoring experience
 */
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  // Split the text into blocks (code blocks vs regular text)
  const blocks = text.split(/(```[\s\S]*?```)/g);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith('```')) {
          // Handle code blocks
          const match = block.match(/```(\w+)?\n?([\s\S]*?)```/);
          const lang = match?.[1] || 'code';
          const code = match?.[2] || '';
          return (
            <div key={i} className="my-4 rounded-xl overflow-hidden border border-white/10 bg-black/40 group relative">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{lang}</span>
                <button 
                  onClick={() => handleCopy(code)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-apple-blue/90 leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Handle regular text with line-by-line block processing
        const lines = block.split('\n');
        return lines.map((line, j) => {
          if (!line.trim()) return <div key={`${i}-${j}`} className="h-2" />;

          // Headers
          const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
          if (headerMatch) {
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            const sizeClass = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
            return <h3 key={`${i}-${j}`} className={`${sizeClass} font-bold text-white mt-6 mb-2 tracking-tight`}>{content}</h3>;
          }

          // Lists
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const content = line.trim().replace(/^[-*]\s+/, '');
            return (
              <div key={`${i}-${j}`} className="flex gap-3 ml-2 group">
                <span className="text-apple-blue font-bold opacity-60 group-hover:opacity-100 transition-opacity mt-1">•</span>
                <span className="flex-1 leading-relaxed text-gray-200">{renderInline(content)}</span>
              </div>
            );
          }

          // Numbered Lists
          if (line.match(/^\d+\.\s/)) {
            return (
              <div key={`${i}-${j}`} className="flex gap-3 ml-2 group">
                <span className="text-apple-blue font-mono text-[10px] mt-1.5 opacity-60">{line.match(/^\d+/)?.[0]}.</span>
                <span className="flex-1 leading-relaxed text-gray-200">{renderInline(line.replace(/^\d+\.\s+/, ''))}</span>
              </div>
            );
          }

          // Default Paragraph
          return <p key={`${i}-${j}`} className="leading-relaxed text-gray-300">{renderInline(line)}</p>;
        });
      })}
    </div>
  );
};

// Simple inline parser for bold and inline code
const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, k) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={k} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={k} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-apple-blue text-[11px] border border-white/5">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

export const TutorView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: "# Welcome to LearnSphere Tutor!\n\nI'm your personal academic partner. I'm currently set to **Active Learning Mode**, meaning I'll prioritize intuition and first principles.\n\nI can help you with:\n- **Explaining** complex theories like `Quantum Decoherence` or `Macroeconomic Cycles`.\n- **Solving** difficult problems step-by-step.\n- **Creating** structured study schedules.\n- **Synthesizing** your notes into easy-to-digest guides.\n\nWhat topic shall we explore today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await geminiService.getTutorResponse(userMessage, messages);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse || "I encountered an error processing that request." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the brain center right now. Check your internet connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 apple-gradient rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Sparkles className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AI Academic Partner</h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
              <span className="flex items-center gap-1 text-apple-blue"><Info size={12} /> Personalized</span>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <span className="text-green-500">Neural Link Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer">
            <Brain size={16} className="text-purple-400" />
            <span className="text-xs font-semibold">Active Learning</span>
          </div>
          <button className="p-3 glass border-white/10 hover:border-white/20 rounded-2xl transition-all">
            <Clock size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <GlassCard className="flex-1 flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/5">
          {/* Scrollable Feed */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scroll-smooth scrollbar-hide">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div className={`flex gap-4 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                    msg.role === 'user' ? 'bg-white/10 border border-white/10' : 'apple-gradient'
                  }`}>
                    {msg.role === 'user' ? <div className="text-xs font-bold text-white">AJ</div> : <Sparkles size={18} className="text-white" />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`rounded-3xl px-6 py-5 text-sm md:text-base ${
                    msg.role === 'user' 
                      ? 'bg-apple-blue text-white rounded-tr-none shadow-xl shadow-apple-blue/10' 
                      : 'glass border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    <FormattedMessage text={msg.text} />
                    <div className={`mt-4 text-[10px] opacity-30 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      Sent {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-4 max-w-[80%]">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-gray-500 animate-spin-slow" />
                  </div>
                  <div className="glass border-white/10 rounded-3xl rounded-tl-none p-6 flex gap-3 items-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium tracking-wide">Synthesizing Response...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Input Interface */}
          <div className="p-6 md:p-8 bg-white/[0.01] border-t border-white/5 backdrop-blur-3xl">
            <div className="max-w-3xl mx-auto flex items-end gap-3">
              <div className="flex-1 relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={Math.min(input.split('\n').length, 5)}
                  placeholder="Message your academic partner..."
                  className="w-full bg-white/5 border border-white/10 rounded-[28px] py-4 pl-6 pr-14 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/50 transition-all resize-none placeholder:text-gray-600 shadow-inner"
                />
                <div className="absolute left-6 -top-6 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal size={12} className="text-apple-blue" /> Press Enter to send • Shift+Enter for new line
                   </span>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`absolute right-2 bottom-2 p-3.5 rounded-2xl transition-all duration-300 ${
                    input.trim() 
                      ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/40 scale-100 translate-y-0' 
                      : 'text-gray-600 cursor-not-allowed scale-90 opacity-40 translate-y-1'
                  }`}
                >
                  <Send size={22} />
                </button>
              </div>
              
              <button className="p-4 glass border-white/10 hover:border-white/20 rounded-2xl transition-all group overflow-hidden relative active:scale-95">
                 <PlusCircle size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                 <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-600 mt-6 font-medium uppercase tracking-[0.2em] opacity-50">
              AI Partner • Powered by Gemini Flash 2.5
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
