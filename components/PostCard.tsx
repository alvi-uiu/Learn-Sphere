import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Post, User } from '../types';
import { formatRelativeTime } from '../utils/date';
import {
    Heart, MessageCircle, Bookmark, CheckCircle2, MoreHorizontal,
    Calendar, Clock, Link as LinkIcon, FileText, Download, X, Edit2, Trash2, ArrowRight, Reply, ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    created_at: string;
    parent_id?: string;
    replies?: Comment[];
}

interface PostCardProps {
    post: Post;
    currentUser: User;
    onUpdate: (updatedPost: Post) => void;
    onDelete: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post: initialPost, currentUser, onUpdate, onDelete }) => {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [post, setPost] = useState(initialPost);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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
        // Organize comments with replies
        const organized = organizeComments(data);
        setComments(organized);
        setLoadingComments(false);
    };

    // Organize comments into parent/child structure
    const organizeComments = (flatComments: Comment[]): Comment[] => {
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create map
        flatComments.forEach(c => {
            commentMap.set(c.id, { ...c, replies: [] });
        });

        // Second pass: organize hierarchy
        flatComments.forEach(c => {
            const comment = commentMap.get(c.id)!;
            if (c.parent_id && commentMap.has(c.parent_id)) {
                commentMap.get(c.parent_id)!.replies!.push(comment);
            } else {
                rootComments.push(comment);
            }
        });

        return rootComments;
    };

    const handleCreateComment = async () => {
        if (!newComment.trim() || !currentUser.id) return;
        try {
            await db.addComment(post.id, {
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                content: newComment,
                parentId: null
            });
            setNewComment('');
            // Refresh comments
            const data = await db.getComments(post.id);
            setComments(organizeComments(data));
            setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
        } catch (e) {
            showToast('Failed to post comment', 'error');
        }
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim() || !currentUser.id) return;
        try {
            await db.addComment(post.id, {
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                content: replyContent,
                parentId: parentId
            });
            setReplyContent('');
            setReplyingTo(null);
            // Refresh comments
            const data = await db.getComments(post.id);
            setComments(organizeComments(data));
            setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
            showToast('Reply posted!', 'success');
        } catch (e) {
            showToast('Failed to post reply', 'error');
        }
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // Render a single comment with replies
    const renderComment = (comment: Comment, depth: number = 0) => (
        <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
            <div className="flex gap-3">
                <img src={comment.user_avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt={comment.user_name} />
                <div className={`flex-1 rounded-xl p-3 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-apple-blue">{comment.user_name}</span>
                        <span className="text-[10px] text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{comment.content}</p>
                    
                    {/* Reply button */}
                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="text-[10px] text-gray-500 hover:text-apple-blue flex items-center gap-1 transition-colors"
                        >
                            <Reply size={10} /> Reply
                        </button>
                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => toggleReplies(comment.id)}
                                className="text-[10px] text-gray-500 hover:text-apple-blue flex items-center gap-1 transition-colors"
                            >
                                {expandedReplies.has(comment.id) ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
                <div className="flex gap-2 mt-2 ml-11">
                    <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                        placeholder={`Reply to ${comment.user_name}...`}
                        className={`flex-1 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue ${
                            isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'
                        }`}
                        autoFocus
                    />
                    <button
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className="px-3 py-2 bg-apple-blue text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                        Reply
                    </button>
                    <button
                        onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
                <div className="mt-2">
                    {comment.replies.map(reply => renderComment(reply, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <GlassCard className="p-6 group relative overflow-visible">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img src={post.avatar} className={`w-11 h-11 rounded-2xl border ${isDark ? 'border-white/10' : 'border-gray-200'}`} alt={post.author} />
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.author}</h4>
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
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {isMenuOpen && currentUser.id === post.authorId && (
                        <div className={`absolute right-0 top-full mt-2 w-32 rounded-xl shadow-xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 ${
                            isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-gray-200'
                        }`}>
                            <button
                                onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 ${
                                    isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <Edit2 size={12} /> Edit
                            </button>
                            <button
                                onClick={() => { handleDelete(); setIsMenuOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs text-red-500 flex items-center gap-2 border-t ${
                                    isDark ? 'hover:bg-red-500/10 border-white/5' : 'hover:bg-red-50 border-gray-200'
                                }`}
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
                        className={`w-full rounded-xl p-3 text-sm focus:outline-none min-h-[100px] ${
                            isDark ? 'bg-white/5 border border-white/10 text-white focus:border-apple-blue/50' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-apple-blue/50'
                        }`}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Cancel</button>
                        <button onClick={handleEditSave} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-apple-blue text-white shadow-lg shadow-apple-blue/20">Save</button>
                    </div>
                </div>
            ) : (
                <p className={`text-sm leading-relaxed mb-4 whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
            )}

            {/* Session Card */}
            {post.sessionData && (
                <div className={`mb-4 rounded-2xl p-4 relative overflow-hidden ${
                    isDark ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100'
                }`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Study Session</p>
                            <h4 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{post.sessionData.course_name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{post.sessionData.topics}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500">
                            <Calendar size={20} />
                        </div>
                    </div>

                    <div className={`flex items-center gap-4 text-xs relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-indigo-500" />
                            <span>{post.sessionData.start_time}</span>
                        </div>
                        {post.sessionData.meeting_link && (
                            <a
                                href={post.sessionData.meeting_link}
                                target="_blank"
                                className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 transition-colors font-medium border-l border-gray-200 pl-4"
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
                                    <div key={i} className={`rounded-xl overflow-hidden border aspect-video md:aspect-[4/3] relative group ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                                        <img src={photo.file_path} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Attachment" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Docs */}
                        {docs.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {docs.map((doc, i) => (
                                    <a key={i} href={doc.file_path} download className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                                        isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                    }`}>
                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{doc.file_name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Document</p>
                                        </div>
                                        <Download size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Actions Footer */}
            <div className={`flex items-center gap-6 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
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
                    <span className="text-xs text-gray-500 group-hover/btn:text-green-500">{post.isSaved ? 'Saved' : 'Save'}</span>
                </button>
            </div>

            {/* Comments Section */}
            {isCommentsOpen && (
                <div className={`mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-300 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    {loadingComments ? (
                        <div className="text-center text-xs text-gray-500 py-2">Loading discussion...</div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => renderComment(comment))}
                            {comments.length === 0 && (
                                <p className="text-center text-xs text-gray-500 italic py-2">No comments yet. Be the first!</p>
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
                                className={`w-full rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-apple-blue ${
                                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-gray-200 text-gray-900'
                                }`}
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
