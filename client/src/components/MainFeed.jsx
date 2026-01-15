import {useState, useEffect, useRef, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {api} from '../utils/api.js'
import FeedPost from './FeedPost.jsx'
import Navigation from './Navigation.jsx'
import FolderManager from './FolderManager.jsx'

function MainFeed({user, setUser}) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [selectedFolder, setSelectedFolder] = useState('all')
    const [showFolderManager, setShowFolderManager] = useState(false)
    const [folders, setFolders] = useState([])
    const [folderStats, setFolderStats] = useState({})
    const observerRef = useRef()
    const folderManagerRef = useRef()
    const navigate = useNavigate()

    // Close folder manager when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (folderManagerRef.current &&
                !folderManagerRef.current.contains(event.target) &&
                !event.target.closest('.manage-folders-btn') &&
                !event.target.closest('.folder-filter-btn')) {
                setShowFolderManager(false)
            }
        }

        if (showFolderManager) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('touchstart', handleClickOutside)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
            document.body.style.overflow = 'auto'
        }
    }, [showFolderManager])

    // Fetch folders and posts
    useEffect(() => {
        fetchFolders()
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [page, selectedFolder])

    const fetchFolders = async () => {
        try {
            const data = await api.folders.getFolders(user.token)
            setFolders(data)

            // Calculate folder stats
            const stats = {}
            data.forEach(folder => {
                stats[folder._id] = {
                    name: folder.name,
                    color: folder.color,
                    postCount: 0
                }
            })
            setFolderStats(stats)
        } catch (error) {
            console.error('Error loading folders:', error)
        }
    }

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const response = await api.getPosts(page, 10, selectedFolder)
            if (response.posts) {
                // Update folder stats
                const newStats = {...folderStats}
                response.posts.forEach(post => {
                    if (post.folderId && newStats[post.folderId]) {
                        newStats[post.folderId].postCount = (newStats[post.folderId].postCount || 0) + 1
                    }
                })
                setFolderStats(newStats)

                // Add folder info to posts
                const postsWithFolderInfo = response.posts.map(post => ({
                    ...post,
                    folderName: post.folderId ? newStats[post.folderId]?.name : null,
                    folderColor: post.folderId ? newStats[post.folderId]?.color : null
                }))

                if (page === 1) {
                    setPosts(postsWithFolderInfo)
                } else {
                    setPosts(prev => [...prev, ...postsWithFolderInfo])
                }
                setHasMore(response.hasMore)
            }
        } catch (error) {
            console.error('Error loading posts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLike = async (postId) => {
        try {
            const updatedPost = await api.likePost(postId, user.token)
            if (updatedPost) {
                setPosts(prev => prev.map(post =>
                    post._id === postId ? {...post, likes: updatedPost.likes} : post
                ))
            }
        } catch (error) {
            console.error('Error liking post:', error)
        }
    }

    const handleComment = async (postId, commentText) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({text: commentText})
            });

            const data = await response.json();

            if (response.ok) {
                return {success: true, post: data};
            } else {
                throw new Error(data.error || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error commenting on post:', error);
            throw error;
        }
    }

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return

        try {
            await api.deletePost(postId, user.token)
            setPosts(prev => prev.filter(post => post._id !== postId))
        } catch (error) {
            console.error('Error deleting post:', error)
        }
    }

    const lastPostRef = (node) => {
        if (loading) return
        if (observerRef.current) observerRef.current.disconnect()

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1)
            }
        })

        if (node) observerRef.current.observe(node)
    }

    const refreshFeed = () => {
        setPage(1)
        fetchFolders()
        fetchPosts()
    }

    const getCurrentFolderName = () => {
        if (selectedFolder === 'all') return 'All Folders'
        const folder = folders.find(f => f._id === selectedFolder)
        return folder ? folder.name : 'Unknown Folder'
    }

    const getCurrentFolderColor = () => {
        if (selectedFolder === 'all') return '#6366f1'
        const folder = folders.find(f => f._id === selectedFolder)
        return folder ? folder.color : '#6366f1'
    }

    const handleFolderSelect = useCallback((folderId) => {
        setSelectedFolder(folderId)
        setPage(1)
        setShowFolderManager(false)
    }, [])

    return (
        <div className={`feed-container ${showFolderManager ? 'overlay-active' : ''}`}>
            <Navigation user={user} setUser={setUser}/>

            {/* Overlay for folder manager */}
            {showFolderManager && (
                <div
                    className="folder-manager-overlay show"
                    onClick={() => setShowFolderManager(false)}
                />
            )}

            <div className="feed-content">
                <div className="feed-header">
                    <div className="feed-title">
                        <h1>Social Feed</h1>
                        {selectedFolder !== 'all' && (
                            <div className="current-folder-tag" style={{background: getCurrentFolderColor()}}>
                                📁 {getCurrentFolderName()}
                            </div>
                        )}
                    </div>
                    <div className="feed-actions">
                        <button
                            onClick={() => navigate('/upload')}
                            className="create-post-btn"
                        >
                            ➕ Create Post
                        </button>

                        <button
                            onClick={refreshFeed}
                            className="refresh-btn"
                            disabled={loading}
                        >
                            🔄 {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="feed-stats">
                    <div className="stat-item">
                        <span className="stat-number">{posts.length}</span>
                        <span className="stat-label">Posts</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">
                            {posts.reduce((acc, post) => acc + post.likes.length, 0)}
                        </span>
                        <span className="stat-label">Total Likes</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{folders.length}</span>
                        <span className="stat-label">Folders</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{user.isAdmin ? '👑 Admin' : '👤 User'}</span>
                        <span className="stat-label">Your Role</span>
                    </div>
                </div>

                <div className="feed-filters">
                    <div className="folder-filter-container" ref={folderManagerRef}>
                        <div className="folder-filter-header">
                            <h3>Filter by Folder</h3>
                            <button
                                onClick={() => setShowFolderManager(!showFolderManager)}
                                className="manage-folders-btn"
                            >
                                {showFolderManager ? '✕ Close' : '📁 Manage Folders'}
                            </button>
                        </div>

                        <div className={`folder-manager-panel ${showFolderManager ? 'show' : ''}`}>
                            {showFolderManager && (
                                <FolderManager
                                    user={user}
                                    onFolderSelect={handleFolderSelect}
                                    selectedFolder={selectedFolder}
                                    onClose={() => setShowFolderManager(false)}
                                />
                            )}
                        </div>

                        <div className="folder-quick-filters">
                            <button
                                className={`folder-filter-btn ${selectedFolder === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedFolder('all')
                                    setPage(1)
                                }}
                                style={{background: selectedFolder === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'}}
                            >
                                🌟 All Folders
                            </button>

                            {folders.slice(0, 5).map(folder => (
                                <button
                                    key={folder._id}
                                    className={`folder-filter-btn ${selectedFolder === folder._id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedFolder(folder._id)
                                        setPage(1)
                                    }}
                                    style={{
                                        background: selectedFolder === folder._id ? folder.color : 'rgba(255, 255, 255, 0.1)',
                                        borderLeft: `4px solid ${folder.color}`
                                    }}
                                >
                                    📁 {folder.name}
                                    <span className="folder-post-count">
                                        {folderStats[folder._id]?.postCount || 0}
                                    </span>
                                </button>
                            ))}

                            {folders.length > 5 && (
                                <div className="more-folders-dropdown">
                                    <select
                                        value={selectedFolder}
                                        onChange={(e) => {
                                            setSelectedFolder(e.target.value)
                                            setPage(1)
                                        }}
                                        className="folder-select-dropdown"
                                    >
                                        <option value="all">All Folders</option>
                                        <option disabled>──────────</option>
                                        {folders.map(folder => (
                                            <option key={folder._id} value={folder._id}>
                                                {folder.name} ({folderStats[folder._id]?.postCount || 0})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="posts-feed">


                    {loading && page === 1 ? (
                        <div className="loading-spinner">
                            <div className="spinner-border">
                                <span className="spinner-label">Loading</span>
                            </div>
                        </div>) : posts.length === 0 ? (
                        <div className="empty-feed">
                            <h2>No posts yet</h2>
                            <p>
                                {selectedFolder === 'all'
                                    ? 'No posts in any of your folders'
                                    : `No posts in ${getCurrentFolderName()} folder`}
                            </p>
                            <button
                                onClick={() => navigate('/upload')}
                                className="create-post-btn large"
                            >
                                Create First Post
                            </button>
                            {selectedFolder !== 'all' && (
                                <button
                                    onClick={() => setSelectedFolder('all')}
                                    className="view-all-btn"
                                >
                                    View All Folders
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post, index) => (
                            <div
                                key={post._id}
                                ref={index === posts.length - 1 ? lastPostRef : null}
                            >
                                <FeedPost
                                    key={post._id}
                                    post={post}
                                    user={user}
                                    onLike={() => handleLike(post._id)}
                                    onComment={handleComment}
                                    onDelete={() => handleDelete(post._id)}
                                />
                            </div>
                        ))
                    )}

                    {loading && page > 1 && (
                        <div className="loading-more">Loading more posts...</div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <div className="no-more-posts">
                            No more posts to load
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MainFeed