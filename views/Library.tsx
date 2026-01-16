
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { FileText, Plus, Search, Layers, ChevronRight, Zap, Upload, Filter, X, File, Download, Brain, Sparkles, BrainCircuit } from 'lucide-react';
import { Note, Resource } from '../types';
import { geminiService } from '../services/geminiService';
import { useToast } from '../components/Toast';
import { db } from '../services/db';

const DEPARTMENTS = ['CSE', 'EEE', 'BBA', 'English', 'Law', 'Architecture'];
const TRIMESTERS = ['Spring', 'Summer', 'Fall'];
const YEARS = ['2023', '2024', '2025', '2026'];
const TYPES = ['Note', 'Slide', 'Question Bank'];

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Note',
    department: 'CSE',
    trimester: 'Spring',
    year: '2025',
    faculty: '',
    subject: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    // Append fields BEFORE file so multer middleware can access them in req.body
    Object.entries(formData).forEach(([key, value]) => data.append(key, value as string));
    data.append('file', file);

    try {
      await db.uploadResource(data);
      showToast('Resource uploaded successfully!', 'success');
      onUpload();
      onClose();
    } catch (err) {
      showToast('Failed to upload resource', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-1">Upload Resource</h2>
        <p className="text-sm text-gray-500 mb-6">Share knowledge with the community</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File</label>
            <div className="border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="mx-auto text-gray-500 mb-2" size={24} />
              <p className="text-sm text-gray-300">{file ? file.name : 'Click to select or drag file here'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Calculus I Midterm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none [&>option]:bg-gray-900"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none [&>option]:bg-gray-900"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Year</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none [&>option]:bg-gray-900"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trimester</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none [&>option]:bg-gray-900"
                value={formData.trimester}
                onChange={e => setFormData({ ...formData, trimester: e.target.value })}
              >
                {TRIMESTERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. MAT101"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Faculty (Optional)</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:border-apple-blue/50 outline-none"
              value={formData.faculty}
              onChange={e => setFormData({ ...formData, faculty: e.target.value })}
              placeholder="e.g. Prof. Smith"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full mt-4 apple-gradient text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

const AIResultModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  result: string;
  mode: 'explain' | 'practice';
  title: string;
}> = ({ isOpen, onClose, result, mode, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-apple-blue/20 shadow-2xl shadow-apple-blue/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${mode === 'explain' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {mode === 'explain' ? <Sparkles size={20} /> : <Brain size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-lg">{mode === 'explain' ? 'Clear Explanation' : 'Practice Set'}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Resource: {title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-black/20">
          <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-strong:text-apple-blue">
            {/* Simple Markdown-like rendering */}
            <div className="space-y-4">
              {result.split('\n').filter(line => line.trim()).map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-3">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>;
                if (line.startsWith('- ') || line.startsWith('* ')) return (
                  <div key={i} className="flex gap-3 ml-2">
                    <span className="text-apple-blue mt-1.5">•</span>
                    <span className="text-gray-300">{line.replace(/^[-*]\s+/, '')}</span>
                  </div>
                );
                if (line.match(/^\d+\.\s/)) return (
                  <div key={i} className="flex gap-3 ml-2">
                    <span className="text-apple-blue font-mono text-xs mt-1">{line.match(/^\d+/)?.[0]}.</span>
                    <span className="text-gray-300">{line.replace(/^\d+\.\s+/, '')}</span>
                  </div>
                );
                return <p key={i} className="leading-relaxed text-gray-300">{line}</p>;
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-apple-blue text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-apple-blue/20"
          >
            Got it, Thanks!
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export const LibraryView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [notes, setNotes] = useState<Note[]>([]); // Keep notes for compatibility if needed, but primary focus is resources now? User asked for filtering "notes" too in resource type
  // Wait, the requirement says "Resource types: Note, Slide, Question Bank". 
  // It seems we should treat existing "Notes" as one type of resource? 
  // Or kept separate? The prompt implies "Uploaded resources... Metadata... Storage".
  // Existing notes are text-based in DB. New resources are files.
  // I will display both or just the new file-based resources?
  // "Users should be able to view resources and filter them..."
  // I'll prioritize the new file-based resources but maybe keep a tab for "My Personal Notes"?
  // Or better, fetch both and mix them?
  // For simplicity and adhering to the "Storage" requirement, I'll focus on the new file/resource system for now as the main view.

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState({
    department: 'All',
    trimester: 'All',
    year: 'All',
    faculty: 'All', // 'All' means no filter
    subject: '',
    type: 'All'
  });

  const [analysisState, setAnalysisState] = useState<{
    isOpen: boolean;
    result: string;
    mode: 'explain' | 'practice';
    title: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    result: '',
    mode: 'explain',
    title: '',
    isLoading: false
  });

  const { showToast } = useToast();

  const loadResources = async () => {
    try {
      const data = await db.getResources(filters);
      setResources(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadResources();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async (resource: Resource, mode: 'explain' | 'practice') => {
    setAnalysisState(prev => ({ ...prev, isLoading: true, mode, title: resource.title }));
    try {
      const res = await fetch(`http://localhost:3001/api/resources/${resource.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysisState(prev => ({ ...prev, result: data.text, isOpen: true, isLoading: false }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Analysis failed', 'error');
      setAnalysisState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUpload={loadResources} />
      <AIResultModal
        isOpen={analysisState.isOpen}
        onClose={() => setAnalysisState(prev => ({ ...prev, isOpen: false }))}
        result={analysisState.result}
        mode={analysisState.mode}
        title={analysisState.title}
      />

      {analysisState.isLoading && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-apple-blue/20 border-t-apple-blue rounded-full animate-spin" />
            <Sparkles className="absolute inset-0 m-auto text-apple-blue animate-pulse" size={24} />
          </div>
          <p className="mt-4 font-bold text-white tracking-widest uppercase text-xs animate-pulse">AI is processing reading your material...</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Academic Library</h2>
          <p className="text-gray-500 text-sm">Access notes, slides, and question banks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Quick subject search..."
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue/50 w-64"
            />
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 apple-gradient text-white rounded-xl hover:opacity-90 transition-all text-sm font-semibold shadow-lg shadow-apple-blue/20"
          >
            <Plus size={16} />
            Upload Resource
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Filter Sidebar */}
        <div className="md:col-span-3 space-y-6">
          <GlassCard className="p-5 space-y-6">
            <div className="flex items-center gap-2 text-gray-400 border-b border-white/5 pb-2">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-500 font-semibold uppercase">Department</label>
              <div className="flex flex-wrap gap-2">
                {['All', ...DEPARTMENTS].map(dept => (
                  <button
                    key={dept}
                    onClick={() => handleFilterChange('department', dept)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filters.department === dept
                      ? 'bg-apple-blue text-white border-transparent'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                      }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-500 font-semibold uppercase">Year</label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-gray-300 [&>option]:bg-gray-900 outline-none focus:border-white/20"
              >
                <option value="All">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-500 font-semibold uppercase">Type</label>
              <div className="space-y-1">
                {['All', ...TYPES].map(type => (
                  <div
                    key={type}
                    onClick={() => handleFilterChange('type', type)}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${filters.type === type ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <span className="text-sm">{type}</span>
                    {filters.type === type && <CheckCircle size={14} className="text-apple-blue" />}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Resources Grid */}
        <div className="md:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-500">
                <p className="text-lg mb-2">No resources found</p>
                <p className="text-sm opacity-50">Try adjusting your filters or upload a new resource</p>
              </div>
            ) : (
              resources.map(resource => (
                <GlassCard key={resource.id} className="group p-5 flex flex-col hover:border-apple-blue/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${resource.type === 'Note' ? 'bg-blue-500/10 text-blue-400' :
                      resource.type === 'Slide' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                      {resource.type === 'Note' ? <FileText size={20} /> :
                        resource.type === 'Slide' ? <Layers size={20} /> : <Zap size={20} />}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {resource.department} • {resource.year}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-200 mb-1 line-clamp-2 leading-tight group-hover:text-apple-blue transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">{resource.subject} • {resource.trimester}</p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">
                      Uploaded {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAnalyze(resource, 'explain')}
                        className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-500 hover:text-yellow-400 transition-all flex items-center gap-1.5"
                        title="Explain Content"
                      >
                        <Sparkles size={14} />
                        <span className="text-[10px] font-bold">Explain</span>
                      </button>
                      <button
                        onClick={() => handleAnalyze(resource, 'practice')}
                        className="p-2 hover:bg-purple-500/10 rounded-lg text-gray-500 hover:text-purple-400 transition-all flex items-center gap-1.5"
                        title="Practice Questions"
                      >
                        <Brain size={14} />
                        <span className="text-[10px] font-bold">Practice</span>
                      </button>
                      <div className="h-4 w-px bg-white/5 mx-1" />
                      <a
                        href={resource.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

