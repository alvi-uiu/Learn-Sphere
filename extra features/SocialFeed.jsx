import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import studyIcon from '../assets/image.png';
import { fetchPosts } from '../api';


const SocialFeed = ({ user }) => {
    const [filter, setFilter] = useState('All');
    const [savedPostIds, setSavedPostIds] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch posts from backend
    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await fetchPosts();
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPost = (newPost) => {
        loadPosts();
    };

    const toggleSave = (postId) => {
        setSavedPostIds(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        );
    };


    const categories = ['All', 'Academic', 'Motivational', 'Tips', 'Session', 'Saved'];

    const filteredPosts = filter === 'All'
        ? posts
        : filter === 'Saved'
            ? posts.filter(post => savedPostIds.includes(post.id))
            : posts.filter(post => post.category === filter);

    return (
        <div className="social-feed-container">
            <div className="feed-header-premium">
                <div>
                    <img src={studyIcon} alt="Study icon" className="feed-header-icon" />
                    <h2>StudyFeed</h2>
                </div>

                <p>Connect. Share. Grow.</p>
            </div>

            <div className="feed-filters-container">
                <div className="feed-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-pill ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <CreatePost onPost={handleNewPost} user={user} />

            <div className="posts-list">
                {filteredPosts.map(post => (
                    <PostCard
                        key={post.id}
                        id={post.id}
                        author={post.author}
                        avatar={post.avatar}
                        category={post.category}
                        content={post.content}
                        timestamp={post.timestamp}
                        initialLikes={post.likes}
                        initialComments={post.comments_count}
                        isSaved={savedPostIds.includes(post.id)}
                        onToggleSave={toggleSave}
                        sessionData={post.session_data}
                        attachments={post.attachments}
                        comments={post.comments}
                        refreshPosts={loadPosts}
                        likedBy={post.liked_by}
                        currentUser={user}
                    />
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#65676b' }}>
                    <p>No posts in this category yet.</p>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
