
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { FileText, Plus, Search, Layers, ChevronRight, Zap } from 'lucide-react';
import { Note } from '../types';
import { geminiService } from '../services/geminiService';
import { useToast } from '../components/Toast';
import { db } from '../services/db';

export const LibraryView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Notes');
  const { showToast } = useToast();

  useEffect(() => {
    const loadNotes = async () => {
      const data = await db.getNotes();
      setNotes(data);
    };
    loadNotes();
  }, []);

  const handleSynthesize = async () => {
    setIsSynthesizing(true);
    showToast('AI Synthesis started...', 'info');
    try {
      const synthesis = await geminiService.synthesizeNotes(notes.map(n => n.content));

      const newNote: Note = {
        id: Date.now().toString(),
        title: 'AI Synthesis: Semester Review',
        subject: 'Multiple Subjects',
        updatedAt: 'Just now',
        content: synthesis,
        isAiSynthesized: true
      };

      const updatedNotes = await db.createNote(newNote);
      setNotes(updatedNotes);
      showToast('Study guide generated successfully!', 'success');
    } catch (error) {
      showToast('Synthesis failed. Please try again.', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCreateNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Untitled Note',
      subject: 'General',
      updatedAt: 'Just now',
      content: 'Start writing...',
      isAiSynthesized: false
    };
    const updatedNotes = await db.createNote(newNote);
    setNotes(updatedNotes);
    showToast('New note created', 'success');
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All Notes' || note.subject === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Central Repository</h2>
          <p className="text-gray-500 text-sm">Organize, share, and synthesize your knowledge</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all text-sm font-semibold disabled:opacity-50"
          >
            <Zap size={16} className={isSynthesizing ? 'animate-pulse' : ''} />
            {isSynthesizing ? 'Synthesizing...' : 'AI Synthesize All'}
          </button>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-4 py-2 apple-gradient text-white rounded-xl hover:opacity-90 transition-all text-sm font-semibold shadow-lg shadow-apple-blue/20"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Folders */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Categories</h4>
          <div className="space-y-1">
            {['All Notes', 'Mathematics', 'Computer Science', 'Economics', 'Physics'].map((folder, i) => (
              <div
                key={folder}
                onClick={() => setSelectedCategory(folder)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${selectedCategory === folder ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <Layers size={18} className={selectedCategory === folder ? 'text-apple-blue' : ''} />
                  <span className="text-sm font-medium">{folder}</span>
                </div>
                <ChevronRight size={14} className={`opacity-50 ${selectedCategory === folder ? 'rotate-90' : ''} transition-transform`} />
              </div>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        <div className="md:col-span-3">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, tags, content..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map(note => (
              <GlassCard
                key={note.id}
                onClick={() => showToast(`Opening ${note.title}...`, 'info')}
                className="group cursor-pointer hover:border-apple-blue/30 transition-all flex flex-col h-48"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-apple-blue/10 transition-colors">
                      <FileText size={20} className="text-gray-400 group-hover:text-apple-blue transition-colors" />
                    </div>
                    {note.isAiSynthesized && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                        <Zap size={10} />
                        AI SYNTH
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1 group-hover:text-apple-blue transition-colors line-clamp-2">{note.title}</h3>
                  <p className="text-[10px] text-gray-500 font-medium uppercase">{note.subject}</p>
                </div>
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 italic">Edited {note.updatedAt}</span>
                  <button className="text-xs text-apple-blue font-bold opacity-0 group-hover:opacity-100 transition-opacity">Open</button>
                </div>
              </GlassCard>
            ))}
            {filteredNotes.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">
                <p>No notes found matching "{searchQuery}" in {selectedCategory}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
