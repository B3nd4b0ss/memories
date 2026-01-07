const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
    // --- Auth ---
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        return res.json();
    },

    register: async (email, password) => {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        return res.json();
    },

    // --- Posts ---
    createPost: async (formData, token) => {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: formData
        });
        return res.json();
    },

    getPosts: async (page = 1, limit = 10) => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const res = await fetch(`${API_URL}/posts?page=${page}&limit=${limit}`, {
            headers: {'Authorization': `Bearer ${user?.token || ''}`}
        });
        return res.json();
    },

    likePost: async (postId, token) => {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}
        });
        return res.json();
    },
    commentPost: async (postId, comment, token) => {
        const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({text: comment})  // Send 'text' field
        });
        return res.json();
    },

    deletePost: async (postId, token) => {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        return res.json();
    },

    fetchMedia: async (postId, filename, token) => {
        const res = await fetch(`${API_URL}/posts/${postId}/media/${filename}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    },

    // --- Users ---
    getUsers: async (token) => {
        const res = await fetch(`${API_URL}/users`, {headers: {'Authorization': `Bearer ${token}`}});
        return res.json();
    },

    updateUserRole: async (userId, isAdmin, token) => {
        const res = await fetch(`${API_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({isAdmin})
        });
        return res.json();
    },

    deleteUser: async (userId, token) => {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        return res.json();
    },

    // --- Stats ---
    getStats: async (token) => {
        const res = await fetch(`${API_URL}/stats`, {headers: {'Authorization': `Bearer ${token}`}});
        return res.json();
    }
};

// --- Helpers ---
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoTypes = ['mp4', 'webm', 'ogg', 'mov'];
    if (imageTypes.includes(ext)) return 'image';
    if (videoTypes.includes(ext)) return 'video';
    return 'unknown';
};
