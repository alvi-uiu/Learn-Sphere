import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { fetchPosts, uploadAvatar, deletePost, API_URL } from '../api';

const Profile = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('My Posts');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [avatarKey, setAvatarKey] = useState(Date.now()); // Force re-render of avatar

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchPosts();
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await uploadAvatar(user.student_id, file);
            // Update local user object (in a real app, update context/store)
            user.avatar = result.avatar;
            setAvatarKey(Date.now());
            // Also save to localStorage to persist
            localStorage.setItem('learnsphere_user', JSON.stringify(user));
        } catch (error) {
            console.error('Avatar upload failed', error);
        }
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deletePost(postId);
                loadData(); // Refresh UI
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    // Filter posts
    const myPosts = posts.filter(p => p.author === user.name);
    const savedPosts = posts.filter(p => p.is_saved); // Assuming is_saved handles local user context, but wait. 
    // Actually, persistence of "saved" is currently local state in SocialFeed.
    // For now, let's just focus on "My Posts" which is persistent in DB.

    // We'll calculate stats
    const totalLikesReceived = myPosts.reduce((acc, curr) => acc + curr.likes, 0);

    return (
        <div className="profile-container">
            {/* Header Section */}
            <div className="profile-header">
                <div className="profile-cover"></div>
                <div className="profile-info-card">
                    <div className="profile-avatar-large" style={{ position: 'relative', overflow: 'hidden' }}>
                        {user.avatar && user.avatar.length > 1 ? (
                            <img
                                key={avatarKey}
                                src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}/${user.avatar}`}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            user.avatar || user.name[0]
                        )}

                        <label htmlFor="avatar-upload" style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            fontSize: '10px',
                            textAlign: 'center',
                            padding: '4px',
                            cursor: 'pointer'
                        }}>
                            EDIT
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div className="profile-identity">
                        <h2>{user.name}</h2>
                        <span className="profile-id">Student ID: {user.student_id}</span>
                    </div>
                    <button onClick={onLogout} className="logout-btn-premium">
                        Current Session: Active • Log Out
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="profile-stats-row">
                <div className="stat-item">
                    <span className="stat-value">{myPosts.length}</span>
                    <span className="stat-label">Posts</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{totalLikesReceived}</span>
                    <span className="stat-label">Likes Received</span>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'My Posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('My Posts')}
                >
                    My Posts
                </button>
                <button
                    className={`profile-tab ${activeTab === 'Saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Saved')}
                >
                    Saved
                </button>
            </div>

            {/* Posts Feed */}
            <div className="profile-feed">
                {activeTab === 'My Posts' && (
                    <div className="posts-list">
                        {myPosts.length > 0 ? (
                            myPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    {...post}
                                    currentUser={user}
                                    refreshPosts={loadData}
                                    // Note: "saved" state logic passed from parent is missing here compared to SocialFeed
                                    // For now we render them, but "Save" toggling might not sync perfectly without a global store.
                                    // We will pass simplified props.
                                    initialLikes={post.likes}
                                    initialComments={post.comments_count}
                                    likedBy={post.liked_by}
                                    onDelete={() => handleDeletePost(post.id)}
                                />
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>You haven't posted anything yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Saved' && (
                    <div className="empty-state">
                        <p>Saved posts feature coming soon globally.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
