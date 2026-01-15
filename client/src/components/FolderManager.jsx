import {useState, useEffect} from 'react';
import {api} from '../utils/api.js';

function FolderManager({user, onFolderSelect, selectedFolder, onClose}) {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(null);
    const [newFolder, setNewFolder] = useState({
        name: '',
        description: '',
        color: '#6366f1',
        isPrivate: false,
        allowedUsers: []
    });
    const [newUserEmail, setNewUserEmail] = useState('');
    const [editingFolder, setEditingFolder] = useState(null);
    const [editUserEmail, setEditUserEmail] = useState('');
    const [message, setMessage] = useState({type: '', text: ''});

    useEffect(() => {
        fetchFolders();
    }, []);

    const fetchFolders = async () => {
        try {
            setLoading(true);
            const data = await api.folders.getFolders(user.token);
            // Filter folders to show only those the user has access to
            const accessibleFolders = data.filter(folder => {
                // Always show folders user owns
                if (folder.creatorEmail === user.email) return true;

                // Show folders user is explicitly allowed in
                if (folder.allowedUsers?.includes(user.email)) return true;

                // Show public folders
                if (!folder.isPrivate) return true;

                // Show all folders to admin users
                if (user.isAdmin) return true;

                return false;
            });
            setFolders(accessibleFolders);
        } catch (error) {
            console.error('Error loading folders:', error);
            setMessage({type: 'error', text: 'Failed to load folders'});
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();

        if (!newFolder.name.trim()) {
            setMessage({type: 'error', text: 'Folder name is required'});
            return;
        }

        try {
            setMessage({type: '', text: ''});

            // Ensure creator always has access
            const folderData = {
                ...newFolder,
                // Always include creator in allowed users
                allowedUsers: [...new Set([...newFolder.allowedUsers, user.email])]
            };

            const result = await api.folders.createFolder(folderData, user.token);

            if (result.folder) {
                setFolders([result.folder, ...folders]);
                setNewFolder({
                    name: '',
                    description: '',
                    color: '#6366f1',
                    isPrivate: false,
                    allowedUsers: []
                });
                setShowCreateForm(false);
                setMessage({type: 'success', text: 'Folder created successfully!'});

                // Auto-select the new folder
                setTimeout(() => {
                    onFolderSelect(result.folder._id);
                }, 500);
            } else if (result.error) {
                setMessage({type: 'error', text: result.error});
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            setMessage({type: 'error', text: 'Failed to create folder. Please try again.'});
        }
    };
    const handleUpdateFolder = async (e) => {
        e.preventDefault();
        if (!editingFolder) return;

        if (!editingFolder.name.trim()) {
            setMessage({type: 'error', text: 'Folder name is required'});
            return;
        }

        try {
            setMessage({type: '', text: ''});
            const result = await api.folders.updateFolder(editingFolder._id, editingFolder, user.token);

            if (result.folder) {
                setFolders(folders.map(f => f._id === editingFolder._id ? result.folder : f));
                setShowEditForm(null);
                setEditingFolder(null);
                setMessage({type: 'success', text: 'Folder updated successfully!'});
            } else if (result.error) {
                setMessage({type: 'error', text: result.error});
            }
        } catch (error) {
            console.error('Error updating folder:', error);
            setMessage({type: 'error', text: 'Failed to update folder. Please try again.'});
        }
    };

    const handleDeleteFolder = async (folderId) => {
        if (!window.confirm('Delete this folder? Posts will remain but lose folder association.')) return;

        try {
            await api.folders.deleteFolder(folderId, user.token);
            setFolders(folders.filter(f => f._id !== folderId));
            if (selectedFolder === folderId) {
                onFolderSelect('all');
            }
            setMessage({type: 'success', text: 'Folder deleted successfully!'});
        } catch (error) {
            console.error('Error deleting folder:', error);
            setMessage({type: 'error', text: 'Failed to delete folder. Please try again.'});
        }
    };

    const startEditFolder = (folder) => {
        setEditingFolder({
            ...folder,
            allowedUsers: [...folder.allowedUsers] // Create a copy
        });
        setShowEditForm(folder._id);
        setShowCreateForm(false);
        setMessage({type: '', text: ''});
    };

    const addUserToNewFolder = () => {
        if (!newUserEmail.trim()) {
            setMessage({type: 'error', text: 'Please enter an email address'});
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail)) {
            setMessage({type: 'error', text: 'Please enter a valid email address'});
            return;
        }

        if (newUserEmail === user.email) {
            setMessage({type: 'error', text: 'You are automatically added as the creator'});
            return;
        }

        // Check for duplicates (case-insensitive)
        const emailLower = newUserEmail.toLowerCase();
        const isDuplicate = newFolder.allowedUsers.some(
            existingEmail => existingEmail.toLowerCase() === emailLower
        );

        if (isDuplicate) {
            setMessage({type: 'error', text: 'User already has access'});
            return;
        }

        setNewFolder({
            ...newFolder,
            allowedUsers: [...newFolder.allowedUsers, newUserEmail]
        });
        setNewUserEmail('');
        setMessage({type: 'success', text: 'User added successfully!'});
    };
    const removeUserFromNewFolder = (email) => {
        if (email === user.email) return; // Can't remove creator

        setNewFolder({
            ...newFolder,
            allowedUsers: newFolder.allowedUsers.filter(e => e !== email)
        });
        setMessage({type: 'info', text: 'User removed from folder'});
    };

    const addUserToEditingFolder = () => {
        if (!editUserEmail.trim()) {
            setMessage({type: 'error', text: 'Please enter an email address'});
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserEmail)) {
            setMessage({type: 'error', text: 'Please enter a valid email address'});
            return;
        }

        if (editUserEmail === editingFolder.creatorEmail) {
            setMessage({type: 'error', text: 'Creator is always included'});
            return;
        }

        if (editingFolder.allowedUsers.includes(editUserEmail)) {
            setMessage({type: 'error', text: 'User already has access'});
            return;
        }

        setEditingFolder({
            ...editingFolder,
            allowedUsers: [...editingFolder.allowedUsers, editUserEmail]
        });
        setEditUserEmail('');
        setMessage({type: 'success', text: 'User added successfully!'});
    };

    const removeUserFromEditingFolder = (email) => {
        if (email === editingFolder.creatorEmail) {
            setMessage({type: 'error', text: 'Cannot remove the folder creator'});
            return;
        }

        setEditingFolder({
            ...editingFolder,
            allowedUsers: editingFolder.allowedUsers.filter(e => e !== email)
        });
        setMessage({type: 'info', text: 'User removed from folder'});
    };

    const handleKeyPress = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'create') {
                addUserToNewFolder();
            } else if (type === 'edit') {
                addUserToEditingFolder();
            }
        }
    };

    const getRandomColor = () => {
        const colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
            '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#f97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const getFolderUserCount = (folder) => {
        return folder.allowedUsers.length;
    };

    return (
        <div className="folder-manager">
            <div className="folder-manager-header">
                <div className="header-left">
                    <h3>📁 Folder Manager</h3>
                    <p className="subtitle">Organize and manage your folders</p>
                </div>
                <div className="folder-manager-actions">
                    <button
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setShowEditForm(null);
                            setEditingFolder(null);
                            setMessage({type: '', text: ''});
                            setNewFolder({
                                name: '',
                                description: '',
                                color: getRandomColor(),
                                isPrivate: false,
                                allowedUsers: []
                            });
                        }}
                        className="create-folder-btn"
                    >
                        {showCreateForm ? '✕ Cancel' : '+ New Folder'}
                    </button>
                    <button
                        onClick={fetchFolders}
                        className="refresh-folders-btn"
                        disabled={loading}
                    >
                        {loading ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                    <button
                        className="folder-manager-close"
                        onClick={onClose}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                    <button
                        className="close-message-btn"
                        onClick={() => setMessage({type: '', text: ''})}
                    >
                        ✕
                    </button>
                </div>
            )}

            {showCreateForm && (
                <div className="create-folder-form">
                    <h4>Create New Folder</h4>
                    <form onSubmit={handleCreateFolder}>
                        <div className="form-group">
                            <label>
                                Folder Name *
                                <span className="required">required</span>
                            </label>
                            <input
                                type="text"
                                value={newFolder.name}
                                onChange={(e) => setNewFolder({...newFolder, name: e.target.value})}
                                required
                                placeholder="Enter folder name"
                                maxLength="50"
                                className="form-input"
                            />
                            <div className="char-counter">{newFolder.name.length}/50</div>
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={newFolder.description}
                                onChange={(e) => setNewFolder({...newFolder, description: e.target.value})}
                                placeholder="Describe this folder..."
                                rows="3"
                                maxLength="200"
                                className="form-textarea"
                            />
                            <div className="char-counter">{newFolder.description.length}/200</div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Folder Color</label>
                                <div className="color-picker">
                                    <input
                                        type="color"
                                        value={newFolder.color}
                                        onChange={(e) => setNewFolder({...newFolder, color: e.target.value})}
                                        className="color-input"
                                    />
                                    <span className="color-value">{newFolder.color}</span>
                                    <button
                                        type="button"
                                        onClick={() => setNewFolder({...newFolder, color: getRandomColor()})}
                                        className="random-color-btn"
                                    >
                                        🎲 Random
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newFolder.isPrivate}
                                        onChange={(e) => setNewFolder({...newFolder, isPrivate: e.target.checked})}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Private Folder</span>
                                </label>
                                <div className="hint">
                                    Only you and added users can see this folder
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Share with Users</label>
                            <div className="hint">
                                Add users by email to give them access to this folder
                            </div>
                            <div className="add-user-input">
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, 'create')}
                                    placeholder="user@example.com"
                                    className="user-email-input"
                                />
                                <button
                                    type="button"
                                    onClick={addUserToNewFolder}
                                    className="add-user-btn"
                                >
                                    Add
                                </button>
                            </div>

                            {newFolder.allowedUsers.length > 0 && (
                                <div className="user-list-container">
                                    <div className="user-list-header">
                                        <span>Users with access ({newFolder.allowedUsers.length})</span>
                                    </div>
                                    <div className="user-list">
                                        {newFolder.allowedUsers.map((email, index) => (
                                            <div key={`${email}-${index}`} className="user-tag">
                                                <span className="user-email">{email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeUserFromNewFolder(email)}
                                                    className="remove-user-btn"
                                                    title="Remove user"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="hint">
                                💡 Tip: You are automatically added as the creator
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="submit-btn primary"
                                disabled={!newFolder.name.trim()}
                            >
                                Create Folder
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showEditForm && editingFolder && (
                <div className="edit-folder-form">
                    <h4>Edit Folder</h4>
                    <form onSubmit={handleUpdateFolder}>
                        <div className="form-group">
                            <label>
                                Folder Name *
                                <span className="required">required</span>
                            </label>
                            <input
                                type="text"
                                value={editingFolder.name}
                                onChange={(e) => setEditingFolder({...editingFolder, name: e.target.value})}
                                required
                                maxLength="50"
                                className="form-input"
                            />
                            <div className="char-counter">{editingFolder.name.length}/50</div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={editingFolder.description || ''}
                                onChange={(e) => setEditingFolder({...editingFolder, description: e.target.value})}
                                rows="3"
                                maxLength="200"
                                className="form-textarea"
                            />
                            <div className="char-counter">{editingFolder.description?.length || 0}/200</div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Folder Color</label>
                                <div className="color-picker">
                                    <input
                                        type="color"
                                        value={editingFolder.color}
                                        onChange={(e) => setEditingFolder({...editingFolder, color: e.target.value})}
                                        className="color-input"
                                    />
                                    <span className="color-value">{editingFolder.color}</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditingFolder({...editingFolder, color: getRandomColor()})}
                                        className="random-color-btn"
                                    >
                                        🎲 Random
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={editingFolder.isPrivate}
                                        onChange={(e) => setEditingFolder({
                                            ...editingFolder,
                                            isPrivate: e.target.checked
                                        })}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="checkbox-text">Private Folder</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Manage User Access</label>
                            <div className="add-user-input">
                                <input
                                    type="email"
                                    value={editUserEmail}
                                    onChange={(e) => setEditUserEmail(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, 'edit')}
                                    placeholder="user@example.com"
                                    className="user-email-input"
                                />
                                <button
                                    type="button"
                                    onClick={addUserToEditingFolder}
                                    className="add-user-btn"
                                >
                                    Add
                                </button>
                            </div>

                            {editingFolder.allowedUsers.length > 0 && (
                                <div className="user-list-container">
                                    <div className="user-list-header">
                                        <span>Users with access ({editingFolder.allowedUsers.length})</span>
                                    </div>
                                    <div className="user-list">
                                        {editingFolder.allowedUsers.map((email, index) => (
                                            <div key={`${email}-${index}`} className="user-tag">
                                                <span
                                                    className={`user-email ${email === editingFolder.creatorEmail ? 'creator' : ''}`}>
                                                    {email === editingFolder.creatorEmail ? '👑 ' : ''}{email}
                                                </span>
                                                {email !== editingFolder.creatorEmail && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeUserFromEditingFolder(email)}
                                                        className="remove-user-btn"
                                                        title="Remove user"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="hint">
                                {editingFolder.creatorEmail === user.email
                                    ? '👑 You are the folder owner'
                                    : `👑 Owner: ${editingFolder.creatorEmail}`}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditForm(null);
                                    setEditingFolder(null);
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="submit-btn primary"
                                disabled={!editingFolder.name.trim()}
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="folders-list-container">
                <div className="folders-list-header">
                    <h4>Your Folders ({folders.length})</h4>
                    <div className="folders-stats">
                        <span className="stat-item">
                            <span
                                className="stat-number">{folders.filter(f => f.creatorEmail === user.email).length}</span>
                            <span className="stat-label">Owned</span>
                        </span>
                        <span className="stat-item">
                            <span className="stat-number">{folders.filter(f => f.isPrivate).length}</span>
                            <span className="stat-label">Private</span>
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading folders...</p>
                    </div>
                ) : folders.length === 0 ? (
                    <div className="empty-folders">
                        <div className="empty-icon">📁</div>
                        <h5>No folders yet</h5>
                        <p>Create your first folder to organize posts!</p>
                        <button
                            onClick={() => {
                                setShowCreateForm(true);
                                setNewFolder({
                                    name: '',
                                    description: '',
                                    color: getRandomColor(),
                                    isPrivate: false,
                                    allowedUsers: []
                                });
                            }}
                            className="create-first-folder-btn"
                        >
                            Create First Folder
                        </button>
                    </div>
                ) : (
                    <div className="folders-list">
                        <div
                            className={`folder-item ${selectedFolder === 'all' ? 'selected' : ''}`}
                            onClick={() => onFolderSelect('all')}
                        >
                            <div className="folder-icon" style={{background: '#6366f1'}}>
                                🌟
                            </div>
                            <div className="folder-info">
                                <div className="folder-header">
                                    <h4>All Folders</h4>
                                    <span className="folder-badge all">View All</span>
                                </div>
                                <p>View posts from all your accessible folders</p>
                                <div className="folder-meta">
                                    <span className="meta-item">
                                        📁 {folders.length} folders
                                    </span>
                                </div>
                            </div>
                            <div className="folder-arrow">
                                →
                            </div>
                        </div>

                        {folders.map((folder, index) => (
                            <div
                                key={`${folder._id}-${index}`}
                                className={`folder-item ${selectedFolder === folder._id ? 'selected' : ''}`}
                                onClick={() => onFolderSelect(folder._id)}
                            >
                                <div className="folder-icon" style={{background: folder.color}}>
                                    📁
                                </div>
                                <div className="folder-info">
                                    <div className="folder-header">
                                        <h4>{folder.name}</h4>
                                        <div className="folder-badges">
                                            {folder.creatorEmail === user.email && (
                                                <span className="folder-badge owner">Owner</span>
                                            )}
                                            {folder.isPrivate ? (
                                                <span className="folder-badge private">Private</span>
                                            ) : (
                                                <span className="folder-badge public">Public</span>
                                            )}
                                        </div>
                                    </div>
                                    <p>{folder.description || 'No description'}</p>
                                    <div className="folder-meta">
                                        <span className="meta-item">
                                            👥 {getFolderUserCount(folder)} users
                                        </span>
                                        <span className="meta-divider">•</span>
                                        <span className="meta-item">
                                            👤 {folder.creatorEmail.split('@')[0]}
                                        </span>
                                    </div>
                                </div>
                                <div className="folder-actions">
                                    {folder.creatorEmail === user.email && (
                                        <>
                                            <button
                                                className="edit-folder-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEditFolder(folder);
                                                }}
                                                title="Edit folder"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="delete-folder-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder._id);
                                                }}
                                                title="Delete folder"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    )}
                                    <div className="folder-arrow">
                                        →
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FolderManager;