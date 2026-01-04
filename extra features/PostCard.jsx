import React, { useState, useEffect } from 'react';
import { toggleLike, addComment, updatePost, API_URL } from '../api';

const PostCard = ({
    id, author, avatar, category, content, timestamp,
    initialLikes, initialComments, isSaved, onToggleSave,
    sessionData, attachments, comments, likedBy, refreshPosts, currentUser, onDelete
}) => {
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(likedBy.some(u => u.name === currentUser?.name));
    const [showComments, setShowComments] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [showLikesModal, setShowLikesModal] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state with props
    useEffect(() => {
        setLikes(initialLikes);
        setIsLiked(likedBy.some(u => u.name === currentUser?.name));
    }, [initialLikes, likedBy, currentUser]);

    const handleLike = async () => {
        // Optimistic update
        const previouslyLiked = isLiked;
        const previousLikes = likes;

        setIsLiked(!previouslyLiked);
        setLikes(previouslyLiked ? likes - 1 : likes + 1);

        try {
            await toggleLike(id, { name: currentUser?.name || 'User', avatar: currentUser?.avatar || 'U' });
            if (refreshPosts) refreshPosts();
        } catch (error) {
            console.error('Failed to toggle like', error);
            // Revert on error
            setIsLiked(previouslyLiked);
            setLikes(previousLikes);
        }
    };

    const handleCommentSubmit = async () => {
        if (commentText.trim()) {
            try {
                await addComment(id, {
                    author: currentUser?.name || 'User',
                    text: commentText,
                    avatar: currentUser?.avatar || 'U'
                });
                setCommentText('');
                if (refreshPosts) refreshPosts();
            } catch (error) {
                console.error('Failed to add comment', error);
            }
        }
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            await updatePost(id, editContent);
            setIsEditing(false);
            if (refreshPosts) refreshPosts();
        } catch (error) {
            console.error("Failed to update post", error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatTimestamp = (isoString) => {
        if (!isoString) return '';
        try {
            // Ensure UTC interpretation if missing Z
            const dateStr = isoString.endsWith('Z') ? isoString : isoString + 'Z';
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return isoString;
        }
    };

    return (
        <div className="post-card" style={{ position: 'relative' }}>
            {/* Post Header */}
            <div className="post-card-header">
                <div className="user-avatar-small" style={{ overflow: 'hidden' }}>
                    {avatar && (avatar.includes('/') || avatar.length > 2) ? (
                        <img
                            src={avatar.startsWith('http') ? avatar : `${API_URL}/${avatar}`}
                            alt={author}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        avatar || author[0]
                    )}
                </div>
                <div className="post-author-meta">
                    <h4 className="post-author-name">{author}</h4>
                    <div className="post-sub-meta">
                        <span>{formatTimestamp(timestamp)}</span>
                        <span>•</span>
                        <span className="category-tag">{category}</span>
                    </div>
                </div>

                {onDelete && currentUser && currentUser.name === author && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                            style={{ background: 'none', border: 'none', color: '#8c7365', cursor: 'pointer', padding: '4px' }}
                            title="Edit Post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '4px' }}
                            title="Delete Post"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Session Info */}
            {sessionData && (
                <div className="session-card-info">
                    <div className="session-info-item">
                        <strong>{sessionData.course_name}</strong>
                    </div>
                    <div className="session-info-item">
                        <span>Key Topics: {sessionData.topics}</span>
                    </div>
                    <div className="session-info-item">
                        <span>Starts: {sessionData.start_time}</span>
                    </div>
                    {sessionData.meeting_link && (
                        <a href={sessionData.meeting_link} target="_blank" rel="noopener noreferrer" className="join-session-btn">
                            Join Session Now
                        </a>
                    )}
                </div>
            )}

            {/* Post Body */}
            <div className="post-body">
                {isEditing ? (
                    <div style={{ marginBottom: '12px' }}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'none', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsEditing(false)} style={{ padding: '6px 16px', borderRadius: '100px', background: '#f0f2f5' }}>Cancel</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} style={{ padding: '6px 16px', borderRadius: '100px', background: 'var(--primary)', color: 'white' }}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="post-body-text">{content}</p>
                )}

                {/* Attachments */}
                {/* Attachments */}
                {attachments && attachments.length > 0 && (() => {
                    const photos = attachments.filter(att => att.file_type === 'photo');
                    const files = attachments.filter(att => att.file_type !== 'photo');

                    const renderImageGrid = (photos) => {
                        const count = photos.length;
                        if (count === 0) return null;

                        let gridClass = 'grid-1';
                        if (count === 2) gridClass = 'grid-2';
                        else if (count === 3) gridClass = 'grid-3';
                        else if (count >= 4) gridClass = 'grid-4';

                        const displayPhotos = count > 4 ? photos.slice(0, 4) : photos;

                        return (
                            <div className={`post-image-grid ${gridClass}`}>
                                {displayPhotos.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="grid-item"
                                        onClick={() => setViewingImage(`http://192.168.184.195:8000/${photo.file_path}`)}
                                    >
                                        <img
                                            src={`http://192.168.184.195:8000/${photo.file_path}`}
                                            alt="attachment"
                                        />
                                        {count > 4 && index === 3 && (
                                            <div className="more-images-overlay">
                                                +{count - 3}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    };

                    return (
                        <div className="post-attachments-container">
                            {renderImageGrid(photos)}

                            {files.length > 0 && (
                                <div className="post-files-list">
                                    {files.map((att, index) => (
                                        <div key={index} className="document-card" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            background: '#f8f9fa',
                                            borderRadius: '12px',
                                            border: '1px solid #e9ecef',
                                            marginTop: '8px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                background: '#fff0ea',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary)',
                                                flexShrink: 0
                                            }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                            </div>
                                            <div className="document-info" style={{ flex: 1 }}>
                                                <div className="document-filename">
                                                    {att.file_name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Document
                                                </div>
                                            </div>
                                            <a
                                                href={`http://192.168.184.195:8000/${att.file_path}`}
                                                download
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '50%',
                                                    background: 'white',
                                                    border: '1px solid #e9ecef',
                                                    color: 'var(--text-main)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    flexShrink: 0
                                                }}
                                                title="Download"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="7 10 12 15 17 10"></polyline>
                                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                                </svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Stats */}
                <div className="post-stats-row">
                    <span style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setShowLikesModal(true)}>
                        {likes} likes
                    </span>
                    <span>{comments.length} comments</span>
                </div>

                {/* Actions */}
                <div className="post-actions-row">
                    <button className={`post-action-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>Like</button>
                    <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>Comment</button>
                    <button className={`post-action-btn ${isSaved ? 'active' : ''}`} onClick={() => onToggleSave(id)}>Save</button>
                </div>

                {/* Comments Modal */}
                {showComments && (
                    <div className="comment-modal-overlay" onClick={() => setShowComments(false)}>
                        <div className="comment-modal-container" onClick={(e) => e.stopPropagation()}>
                            <h3>Comments</h3>
                            <div className="comment-modal-body">
                                {comments.length > 0 ? comments.map(c => (
                                    <div key={c.id} className="comment-item">
                                        <div className="comment-avatar">{c.author[0]}</div>
                                        <div className="comment-content">
                                            <div className="comment-author">{c.author}</div>
                                            <div className="comment-text">{c.text}</div>
                                            <div className="comment-timestamp">{c.timestamp}</div>
                                        </div>
                                    </div>
                                )) : <div>No comments yet.</div>}
                            </div>
                            <div className="comment-modal-footer">
                                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." />
                                <button onClick={handleCommentSubmit} disabled={!commentText.trim()}>Post</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Likes Modal */}
                {showLikesModal && (
                    <div className="comment-modal-overlay" onClick={() => setShowLikesModal(false)}>
                        <div className="comment-modal-container" onClick={(e) => e.stopPropagation()}>
                            <h3>Liked by {likedBy.length} {likedBy.length === 1 ? 'person' : 'people'}</h3>
                            {likedBy.length > 0 ? likedBy.map((user, idx) => (
                                <div key={idx} className="comment-item">
                                    <div className="comment-avatar">{user.avatar}</div>
                                    <div className="comment-content">{user.name}</div>
                                </div>
                            )) : <div>No likes yet.</div>}
                        </div>
                    </div>
                )}
                {/* Image Viewer */}
                {viewingImage && (
                    <div className="image-viewer-overlay" onClick={() => setViewingImage(null)}>
                        <div className="image-viewer-header" onClick={(e) => e.stopPropagation()}>
                            <a
                                href={viewingImage}
                                download
                                className="image-viewer-btn"
                                title="Download Image"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </a>
                            <button className="image-viewer-btn" onClick={() => setViewingImage(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <img
                            src={viewingImage}
                            alt="Full view"
                            className="image-viewer-content"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostCard;
