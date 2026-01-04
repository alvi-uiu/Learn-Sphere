import React, { useState, useRef } from 'react';
import { createPost, API_URL } from '../api';

const CreatePost = ({ onPost, user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Academic');
    const [sessionData, setSessionData] = useState({
        courseName: '',
        topics: '',
        startTime: '',
        meetingLink: ''
    });
    const [attachments, setAttachments] = useState([]); // Array of { file, preview, type }
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);

    React.useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [isModalOpen]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!content.trim() && attachments.length === 0) return;

        // Create FormData for backend
        const formData = new FormData();
        formData.append('author', user?.name || 'Student');
        formData.append('avatar', user?.avatar || 'U');
        formData.append('category', category);
        formData.append('content', content);

        // Handle Session Data
        if (category === 'Session') {
            formData.append('session_course_name', sessionData.courseName);
            formData.append('session_topics', sessionData.topics);
            formData.append('session_start_time', sessionData.startTime);
            formData.append('session_meeting_link', sessionData.meetingLink);
        }

        // Handle File Uploads
        attachments.forEach(att => {
            formData.append('files', att.file);
        });

        try {
            await createPost(formData);

            // Reset form
            setContent('');
            setSessionData({ courseName: '', topics: '', startTime: '', meetingLink: '' });
            setAttachments([]);
            setIsModalOpen(false);

            if (onPost) onPost(); // Remove argument since we reload from backend
        } catch (error) {
            console.error('Failed to create post:', error);
            // Optionally set error state here
        }
    };

    const handleFileChange = (e, type) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachments(prev => [...prev, {
                    file,
                    preview: reader.result,
                    type
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const categories = ['Academic', 'Motivational', 'Tips', 'Session'];

    return (
        <div className="create-post-card">
            <div className="create-post-upper">
                <div className="user-avatar-small" style={{ overflow: 'hidden' }}>
                    {user?.avatar && (user.avatar.includes('/') || user.avatar.length > 2) ? (
                        <img
                            src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/${user.avatar}`}
                            alt={user?.name || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        user?.avatar || 'U'
                    )}
                </div>
                <div
                    className="fake-input-box"
                    onClick={() => setIsModalOpen(true)}
                >
                    What's on your mind, student?
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'photo')}
            />
            <input
                type="file"
                ref={docInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={(e) => handleFileChange(e, 'doc')}
            />



            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-premium">
                            <button className="cancel-txt-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <h3>Create Post</h3>
                            <button
                                className="post-txt-btn"
                                disabled={!content.trim() && attachments.length === 0}
                                onClick={handleSubmit}
                            >
                                Post
                            </button>
                        </div>

                        <div className="post-form-premium">
                            <div className="post-user-info">
                                <div className="user-avatar-small" style={{ overflow: 'hidden' }}>
                                    {user?.avatar && (user.avatar.includes('/') || user.avatar.length > 2) ? (
                                        <img
                                            src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/${user.avatar}`}
                                            alt={user?.name || 'User'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        user?.avatar || 'U'
                                    )}
                                </div>
                                <span>{user?.name || 'You'}</span>
                            </div>

                            <div className="create-post-lower" style={{ borderTop: 'none', padding: '12px 0', gap: '16px', marginTop: '-8px' }}>
                                <div
                                    className="post-option"
                                    style={{ color: '#ff6b2b', flex: 'none', background: '#fdf2f0', padding: '8px 16px', borderRadius: '12px' }}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" /></svg>
                                    Photo
                                </div>
                                <div
                                    className="post-option"
                                    style={{ color: '#45bd62', flex: 'none', background: '#f0f9f3', padding: '8px 16px', borderRadius: '12px' }}
                                    onClick={() => docInputRef.current.click()}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                    Doc
                                </div>
                            </div>

                            {attachments.length > 0 && (
                                <div className="attachment-previews" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    {attachments.map((att, index) => (
                                        <div key={index} className="attachment-preview-item" style={{ position: 'relative', width: '80px', height: '80px' }}>
                                            {att.type === 'photo' ? (
                                                <img src={att.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', textAlign: 'center', padding: '4px' }}>
                                                    📄 {att.file.name.substring(0, 10)}...
                                                </div>
                                            )}
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="category-selector-chips">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`category-chip-btn ${category === cat ? 'selected' : ''}`}
                                        onClick={() => setCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {category === 'Session' && (
                                <div className="session-fields-container">
                                    <input
                                        type="text"
                                        className="session-input"
                                        placeholder="Course Name (e.g. Data Structures)"
                                        value={sessionData.courseName}
                                        onChange={(e) => setSessionData({ ...sessionData, courseName: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="session-input"
                                        placeholder="Topics (e.g. Binary Search Trees)"
                                        value={sessionData.topics}
                                        onChange={(e) => setSessionData({ ...sessionData, topics: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="session-input"
                                        placeholder="Start Time (e.g. 7:00 PM Today)"
                                        value={sessionData.startTime}
                                        onChange={(e) => setSessionData({ ...sessionData, startTime: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="session-input"
                                        placeholder="Meeting Link (Zoom/Meet)"
                                        value={sessionData.meetingLink}
                                        onChange={(e) => setSessionData({ ...sessionData, meetingLink: e.target.value })}
                                    />
                                </div>
                            )}

                            <textarea
                                className="premium-textarea"
                                placeholder="What's on your mind, student?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePost;
