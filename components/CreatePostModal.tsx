import React, { useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { User } from '../types';
import { db } from '../services/db';
import { X, Image as ImageIcon, FileText, Calendar, Clock, Link as LinkIcon, BookOpen } from 'lucide-react';
import { useToast } from './Toast';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
    user: User;
}

const CATEGORIES = ['Academic', 'Motivational', 'Tips', 'Session'];

interface AttachmentPreview {
    file: File;
    preview: string;
    type: 'photo' | 'doc';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated, user }) => {
    const { showToast } = useToast();
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Academic');
    const [loading, setLoading] = useState(false);

    // Session State
    const [sessionData, setSessionData] = useState({
        courseName: '',
        topics: '',
        startTime: '',
        meetingLink: ''
    });

    // Attachments
    const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
        if (!e.target.files?.length) return;

        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachments(prev => [...prev, {
                    file,
                    preview: reader.result as string,
                    type
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const isSession = category === 'Session';
        const hasSessionData = isSession && (sessionData.courseName || sessionData.topics || sessionData.startTime || sessionData.meetingLink);

        if (!content.trim() && attachments.length === 0 && !hasSessionData) return;
        setLoading(true);

        try {
            // Transform attachments for simple storage (in real app, upload here)
            // For now, we store base64 preview as the URL to "mock" the file host
            const processedAttachments = attachments.map(att => ({
                id: Date.now().toString() + Math.random(),
                file_path: att.preview, // Mocking file path with base64 for demo
                file_name: att.file.name,
                file_type: att.type
            }));

            // Prepare Session Data
            const finalSessionData = category === 'Session' ? {
                course_name: sessionData.courseName,
                topics: sessionData.topics,
                start_time: sessionData.startTime,
                meeting_link: sessionData.meetingLink
            } : undefined;

            await db.createPost({
                author: user.name,
                authorId: user.id || 'u_anon',
                avatar: user.avatar,
                content,
                category,
                sessionData: finalSessionData,
                attachments: processedAttachments
            });

            showToast('Post created successfully!', 'success');
            onPostCreated();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to create post', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose}></div>
            <GlassCard className="w-full max-w-xl relative bg-[#0a0a0a] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 p-0 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold text-white">Create Post</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-white/10" />
                        <div>
                            <p className="font-semibold text-sm text-white">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.role || 'Student'}</p>
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${category === cat
                                    ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Session Fields */}
                    {category === 'Session' && (
                        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Session Details</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold pl-1">Course</label>
                                    <div className="relative">
                                        <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            value={sessionData.courseName}
                                            onChange={(e) => setSessionData({ ...sessionData, courseName: e.target.value })}
                                            placeholder="e.g. Adv. Calculus"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-apple-blue/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold pl-1">Time</label>
                                    <div className="relative">
                                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            value={sessionData.startTime}
                                            onChange={(e) => setSessionData({ ...sessionData, startTime: e.target.value })}
                                            placeholder="e.g. Tmrw 2 PM"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-apple-blue/50"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold pl-1">Topics</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            value={sessionData.topics}
                                            onChange={(e) => setSessionData({ ...sessionData, topics: e.target.value })}
                                            placeholder="e.g. Integration, Series"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-apple-blue/50"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase font-semibold pl-1">Meeting Link</label>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            value={sessionData.meetingLink}
                                            onChange={(e) => setSessionData({ ...sessionData, meetingLink: e.target.value })}
                                            placeholder="https://meet..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-apple-blue/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                        className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-600 resize-none p-0"
                    />

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {attachments.map((att, i) => (
                                <div key={i} className="relative group">
                                    {att.type === 'photo' ? (
                                        <img src={att.preview} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center p-1">
                                            <FileText size={20} className="text-gray-400 mb-1" />
                                            <span className="text-[8px] text-gray-500 truncate w-full text-center">{att.file.name}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => removeAttachment(i)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 hover:bg-white/5 rounded-xl text-apple-blue transition-colors flex items-center gap-2 bg-apple-blue/5"
                        >
                            <ImageIcon size={18} />
                            <span className="text-xs font-medium">Photo</span>
                        </button>
                        <button
                            onClick={() => docInputRef.current?.click()}
                            className="p-2 hover:bg-white/5 rounded-xl text-green-500 transition-colors flex items-center gap-2 bg-green-500/5"
                        >
                            <FileText size={18} />
                            <span className="text-xs font-medium">Doc</span>
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileChange(e, 'photo')}
                        />
                        <input
                            type="file"
                            ref={docInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            multiple
                            onChange={(e) => handleFileChange(e, 'doc')}
                        />
                    </div>
                </div>

                <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (!content.trim() && attachments.length === 0)}
                        className="apple-gradient text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-apple-blue/20 disabled:opacity-50 min-w-[100px] flex justify-center"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Post'}
                    </button>
                </div>

            </GlassCard>
        </div>
    );
};
