import { Post, Note, User, Resource } from '../types';

const API_URL = '/api';

export const db = {
    // Posts
    getPosts: async (): Promise<Post[]> => {
        try {
            const res = await fetch(`${API_URL}/posts`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    createPost: async (post: Post): Promise<Post[]> => {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(post)
        });
        return res.json();
    },

    likePost: async (id: string, userId: string): Promise<Post[]> => {
        const res = await fetch(`${API_URL}/posts/${id}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return res.json();
    },

    // Notes
    getNotes: async (): Promise<Note[]> => {
        const res = await fetch(`${API_URL}/notes`);
        return res.json();
    },

    createNote: async (note: Note): Promise<Note[]> => {
        const res = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        return res.json();
    },

    // Resources
    getResources: async (filters: any): Promise<Resource[]> => {
        // Filter out empty/null values
        const cleanFilters: any = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== 'All') {
                cleanFilters[key] = filters[key];
            }
        });
        const params = new URLSearchParams(cleanFilters);
        const res = await fetch(`${API_URL}/resources?${params}`);
        return res.json();
    },

    uploadResource: async (formData: FormData): Promise<any> => {
        if (!formData.has('userId')) {
            formData.append('userId', 'u_alex');
        }
        // Source will be 'chat' or 'library' (default 'library' in backend if missing)
        const res = await fetch(`${API_URL}/resources`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Upload Error Details:', errorText);
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
        }
        return res.json();
    },

    // Auth
    login: async (credentials: any): Promise<User> => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    register: async (userData: any): Promise<User> => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    },

    // Comments
    getComments: async (postId: string): Promise<any[]> => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    addComment: async (postId: string, commentData: any): Promise<any[]> => {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: commentData.userId,
                userName: commentData.userName,
                userAvatar: commentData.userAvatar,
                content: commentData.content,
                parentId: commentData.parentId || null
            })
        });
        if (!res.ok) throw new Error('Failed to add comment');
        return res.json();
    },

    // Save Post
    savePost: async (postId: string, userId: string): Promise<string[]> => {
        const res = await fetch(`${API_URL}/posts/${postId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) throw new Error('Failed to save post');
        return res.json();
    },

    // Edit Post
    editPost: async (postId: string, content: string): Promise<void> => {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Failed to edit post');
    },

    // Delete Post
    deletePost: async (postId: string): Promise<void> => {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete post');
    },

    // User (Local State Helper)
    getUser: (): User | null => {
        return null; // State managed by App.tsx now
    },

    setUser: (user: User | null) => {
        // No-op
    }
};
