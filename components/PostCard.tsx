import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Post, User } from '../types';
import { formatRelativeTime } from '../utils/date';
import {
    Heart, MessageCircle, Share2, Bookmark, CheckCircle2, MoreHorizontal,
    Calendar, Clock, Link as LinkIcon, FileText, Download, TrendingUp, X, Edit2, Trash2, ArrowRight
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from './Toast';

interface PostCardProps {
    post: Post;
    currentUser: User;
    onUpdate: (updatedPost: Post) => void;
    onDelete: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post: initialPost, currentUser, onUpdate, onDelete }) => {
    const { showToast } = useToast();
    const [post, setPost] = useState(initialPost);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Edit Mode
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    // Like Handler
    const handleLike = async () => {
        // Optimistic
        setPost(prev => ({ ...prev, likes: prev.likes + 1 }));
        try {
            await db.likePost(post.id);
        } catch (e) {
            setPost(initialPost); // Revert
            console.error(e);
        }
    };

    // Save Handler
    const handleSave = async () => {
        if (!currentUser.id) return;

        // Optimistic
        const newSavedState = !post.isSaved;
        setPost(prev => ({ ...prev, isSaved: newSavedState }));

        try {
            await db.savePost(post.id, currentUser.id);
            showToast(newSavedState ? 'Post saved to library' : 'Post removed from library', 'success');
        } catch (e) {
            setPost(prev => ({ ...prev, isSaved: !newSavedState })); // Revert
            console.error(e);
        }
    };

    // Edit Handler
    const handleEditSave = async () => {
        try {
            await db.editPost(post.id, editContent);
            setPost(prev => ({ ...prev, content: editContent }));
            setIsEditing(false);
            showToast('Post updated successfully', 'success');
        } catch (e) {
            showToast('Failed to update post', 'error');
        }
    };

    // Delete Handler
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await db.deletePost(post.id);
            onDelete(post.id);
            showToast('Post deleted', 'success');
        } catch (e) {
            showToast('Failed to delete post', 'error');
        }
    };

    // Comment Handlers
    const toggleComments = async () => {
        if (isCommentsOpen) {
            setIsCommentsOpen(false);
            return;
        }
        setIsCommentsOpen(true);
        setLoadingComments(true);
        const data = await db.getComments(post.id);
        setComments(data);
        setLoadingComments(false);
    };

    const handleCreateComment = async () => {
        if (!newComment.trim() || !currentUser.id) return;
        try {
            await db.addComment(post.id, {
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                content: newComment
            });
            setNewComment('');
            // Refresh comments
            const data = await db.getComments(post.id);
            setComments(data);
            setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
        } catch (e) {
            showToast('Failed to post comment', 'error');
        }
    };

    return (
        <GlassCard className="p-6 group relative overflow-visible">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img src={post.avatar} className="w-11 h-11 rounded-2xl border border-white/5" alt={post.author} />
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{post.author}</h4>
                            {post.author.includes('Sys') && <CheckCircle2 size={12} className="text-apple-blue fill-apple-blue/10" />}
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">
                            {formatRelativeTime(post.timestamp)} • <span className="text-apple-blue/80">{post.category}</span>
                        </p>
                    </div>
                </div>

                {/* Context Menu for Owner */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {isMenuOpen && currentUser.id === post.authorId && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                            >
                                <Edit2 size={12} /> Edit
                            </button>
                            <button
                                onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            {isEditing ? (
                <div className="mb-4">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-apple-blue/50 min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white">Cancel</button>
                        <button onClick={handleEditSave} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-apple-blue text-white shadow-lg shadow-apple-blue/20">Save</button>
                    </div>
                </div>
            ) : (
                <p className="text-gray-200 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Session Card */}
            {post.sessionData && (
                <div className="mb-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Study Session</p>
                            <h4 className="text-lg font-bold text-white leading-tight">{post.sessionData.course_name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{post.sessionData.topics}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                            <Calendar size={20} />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-300 relative z-10">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-indigo-400" />
                            <span>{post.sessionData.start_time}</span>
                        </div>
                        {post.sessionData.meeting_link && (
                            <a
                                href={post.sessionData.meeting_link}
                                target="_blank"
                                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors font-medium border-l border-white/10 pl-4"
                            >
                                <LinkIcon size={14} />
                                <span>Join Meeting</span>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Attachments Grid */}
            {post.attachments && post.attachments.length > 0 && (() => {
                const photos = post.attachments.filter(att => att.file_type === 'photo');
                const docs = post.attachments.filter(att => att.file_type !== 'photo');

                return (
                    <div className="space-y-3 mb-4">
                        {/* Photos */}
                        {photos.length > 0 && (
                            <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {photos.map((photo, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden border border-white/5 aspect-video md:aspect-[4/3] relative group">
                                        <img src={photo.file_path} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Attachment" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Docs */}
                        {docs.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {docs.map((doc, i) => (
                                    <a key={i} href={doc.file_path} download className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-200 truncate">{doc.file_name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Document</p>
                                        </div>
                                        <Download size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Actions Footer */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-2 group/btn"
                >
                    <Heart size={20} className={`transition-all active:scale-90 ${post.likes > initialPost.likes ? 'text-pink-500 fill-pink-500/20' : 'text-gray-500 group-hover/btn:text-pink-500'}`} />
                    <span className="text-xs font-bold text-gray-500 group-hover/btn:text-pink-500">{post.likes}</span>
                </button>
                <button
                    onClick={toggleComments}
                    className={`flex items-center gap-2 group/btn ${isCommentsOpen ? 'text-apple-blue' : ''}`}
                >
                    <MessageCircle size={20} className={`text-gray-500 group-hover/btn:text-apple-blue transition-all ${isCommentsOpen ? 'text-apple-blue' : ''}`} />
                    <span className="text-xs font-bold text-gray-500 group-hover/btn:text-apple-blue">{post.comments}</span>
                </button>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 ml-auto group/btn ${post.isSaved ? 'text-green-500' : ''}`}
                >
                    <Bookmark size={20} className={`text-gray-500 group-hover/btn:text-green-500 transition-all ${post.isSaved ? 'text-green-500 fill-green-500/20' : ''}`} />
                </button>
                <button className="flex items-center gap-2 group/btn">
                    <Share2 size={20} className="text-gray-500 group-hover/btn:text-purple-500 transition-all" />
                </button>
            </div>

            {/* Comments Section */}
            {isCommentsOpen && (
                <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                    {loadingComments ? (
                        <div className="text-center text-xs text-gray-500 py-2">Loading discussion...</div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <img src={comment.user_avatar} className="w-8 h-8 rounded-full" alt={comment.user_name} />
                                    <div className="flex-1 bg-white/5 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold font-mono text-apple-blue">{comment.user_name}</span>
                                            <span className="text-[10px] text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                                        </div>
                                        <p className="text-xs text-gray-300">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-center text-xs text-gray-600 italic py-2">No comments yet. Be the first!</p>
                            )}
                        </div>
                    )}

                    {/* New Comment Input */}
                    <div className="flex gap-3 mt-4">
                        <img src={currentUser.avatar || "https://picsum.photos/seed/user1/40/40"} className="w-8 h-8 rounded-full" />
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
                                placeholder="Write a comment..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue"
                            />
                            <button
                                onClick={handleCreateComment}
                                disabled={!newComment.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-apple-blue disabled:opacity-50"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </GlassCard>
    );
};
