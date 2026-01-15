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

    getPosts: async (page = 1, limit = 10, folderId = 'all') => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const res = await fetch(`${API_URL}/posts?page=${page}&limit=${limit}&folderId=${folderId}`, {
            headers: {'Authorization': `Bearer ${user?.token || ''}`}
        });
        return res.json();
    },

    likePost: async (postId, token) => {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
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
            body: JSON.stringify({text: comment})
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
        const res = await fetch(`${API_URL}/users`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        return res.json();
    },

    updateUserRole: async (userId, isAdmin, token) => {
        const res = await fetch(`${API_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
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
        const res = await fetch(`${API_URL}/stats`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        return res.json();
    },

    // --- Folders ---
    folders: {
        createFolder: async (folderData, token) => {
            const res = await fetch(`${API_URL}/folders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(folderData)
            });
            return res.json();
        },

        getFolders: async (token) => {
            const res = await fetch(`${API_URL}/folders`, {
                headers: {'Authorization': `Bearer ${token}`}
            });
            return res.json();
        },

        getFolder: async (folderId, token) => {
            const res = await fetch(`${API_URL}/folders/${folderId}`, {
                headers: {'Authorization': `Bearer ${token}`}
            });
            return res.json();
        },

        updateFolder: async (folderId, updates, token) => {
            const res = await fetch(`${API_URL}/folders/${folderId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            return res.json();
        },

        deleteFolder: async (folderId, token) => {
            const res = await fetch(`${API_URL}/folders/${folderId}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${token}`}
            });
            return res.json();
        },

        getAllFolders: async (token) => {
            const res = await fetch(`${API_URL}/folders/all`, {
                headers: {'Authorization': `Bearer ${token}`}
            });
            return res.json();
        }
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