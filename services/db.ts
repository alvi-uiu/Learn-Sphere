import { Post, Note, User } from '../types';

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

    likePost: async (id: string): Promise<Post[]> => {
        const res = await fetch(`${API_URL}/posts/${id}/like`, { method: 'POST' });
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
            body: JSON.stringify(commentData)
        });
        if (!res.ok) throw new Error('Failed to add comment');
        return res.json();
    },

    // User (Local State Helper)
    getUser: (): User | null => {
        return null; // State managed by App.tsx now
    },

    setUser: (user: User | null) => {
        // No-op
    }
};
