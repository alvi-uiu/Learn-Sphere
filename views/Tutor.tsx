
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Send, Sparkles, Brain, Clock, PlusCircle, Terminal, Info, Copy, Check, MessageSquare, Trash2, Plus } from 'lucide-react';
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
  const [mode, setMode] = useState<'general' | 'resource'>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch Chat Threads
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/chats?userId=u_alex');
      const data = await res.json();
      if (Array.isArray(data)) {
        setChats(data);
        if (data.length > 0 && !currentChatId) {
          // Select most recent chat by default
          selectChat(data[0].id);
        } else if (data.length === 0) {
          // Initialize with welcome message if no chats
          setMessages([{
            role: 'model',
            text: "# Welcome to LearnSphere Tutor!\n\nI'm your personal academic partner. Start a new conversation or upload resources."
          }]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch chats", e);
    }
  };

  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Failed to load chat messages", e);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([{
      role: 'model',
      text: "# New Conversation\n\nHow can I help you today?"
    }]);
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`http://localhost:3001/api/chats/${chatId}`, { method: 'DELETE' });
      const newChats = chats.filter(c => c.id !== chatId);
      setChats(newChats);
      if (currentChatId === chatId) {
        if (newChats.length > 0) selectChat(newChats[0].id);
        else createNewChat();
      }
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: 'u_alex',
          mode,
          chatId: currentChatId // Pass current chatId (null if new)
        })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'model', text: data.text }]);

      // If it was a new chat, update ID
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId);
      }

      // Always refresh the list
      fetchChats();

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ **System Error**: ${errorMessage}\n\nPlease check server logs or configuration.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ Please upload a PDF file for me to read." }]);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('type', 'Note');
    formData.append('department', 'General');
    formData.append('year', '2026');
    formData.append('trimester', 'Spring');
    formData.append('subject', 'Chat Upload');
    formData.append('userId', 'u_alex');
    formData.append('source', 'chat'); // Mark as chat upload (isolated)
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/api/resources', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'model', text: `✅ I've processed **${file.name}**. Switch to **Resource Mode** to ask questions about it!` }]);
      setMode('resource');
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "⚠️ Failed to upload and process the file." }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Sidebar history */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        {/* New Chat Button */}
        <button
          onClick={createNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-2xl transition-all shadow-lg shadow-apple-blue/20 group"
        >
          <Plus size={20} />
          <span className="font-semibold">New Chat</span>
        </button>

        {/* List */}
        <GlassCard className="flex-1 overflow-hidden flex flex-col border-white/5">
          <div className="p-3 overflow-y-auto scrollbar-hide space-y-2 h-full">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => selectChat(chat.id)}
                className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentChatId === chat.id ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare size={14} className={currentChatId === chat.id ? "text-apple-blue" : "text-gray-500"} />
                    <span className={`text-sm truncate ${currentChatId === chat.id ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {chat.title || 'Conversation'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="text-[10px] text-gray-600 mt-1 pl-6">
                  {new Date(chat.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            ))}
            {chats.length === 0 && (
              <div className="text-center p-4 text-gray-500 text-xs">
                No history yet. Start a new chat!
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Header inside chat area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 apple-gradient rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AI Tutor</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                {currentChatId ? 'Active Session' : 'New Session'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('general')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${mode === 'general' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
            >
              <Sparkles size={14} className={mode === 'general' ? "text-yellow-400" : ""} />
              <span className="text-[10px] font-semibold">General</span>
            </button>
            <button
              onClick={() => setMode('resource')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${mode === 'resource' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
            >
              <Brain size={14} className={mode === 'resource' ? "text-purple-400" : ""} />
              <span className="text-[10px] font-semibold">Resources</span>
            </button>
          </div>
        </div>

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
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-white/10 border border-white/10' : 'apple-gradient'
                    }`}>
                    {msg.role === 'user' ? <div className="text-xs font-bold text-white">AJ</div> : <Sparkles size={14} className="text-white" />}
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-3xl px-6 py-5 text-sm md:text-base ${msg.role === 'user'
                    ? 'bg-apple-blue text-white rounded-tr-none shadow-xl shadow-apple-blue/10'
                    : 'glass border-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                    <FormattedMessage text={msg.text} />
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-4 max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-gray-500 animate-spin-slow" />
                  </div>
                  <div className="glass border-white/10 rounded-3xl rounded-tl-none p-4 flex gap-3 items-center">
                    <span className="text-xs text-gray-400 font-medium tracking-wide">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Input Interface */}
          <div className="p-4 md:p-6 bg-white/[0.01] border-t border-white/5 backdrop-blur-3xl">
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
                  className="w-full bg-white/5 border border-white/10 rounded-[24px] py-3 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue/50 transition-all resize-none placeholder:text-gray-600 shadow-inner"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`absolute right-1.5 bottom-1.5 p-2.5 rounded-xl transition-all duration-300 ${input.trim()
                    ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/40 scale-100 translate-y-0'
                    : 'text-gray-600 cursor-not-allowed scale-90 opacity-40 translate-y-1'
                    }`}
                >
                  <Send size={18} />
                </button>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-3 glass border-white/10 hover:border-white/20 rounded-xl transition-all group overflow-hidden relative active:scale-95 flex-shrink-0"
              >
                {isUploading ? (
                  <Sparkles size={20} className="text-apple-blue animate-spin" />
                ) : (
                  <PlusCircle size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                )}
                <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-[10px] text-center text-gray-600 mt-4 font-medium uppercase tracking-[0.2em] opacity-50">
              AI Partner • Powered by Gemini Flash 2.5
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
