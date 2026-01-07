import {useState, useEffect, useRef} from 'react'
import {useNavigate} from 'react-router-dom'
import {api} from '../utils/api.js'
import FeedPost from './FeedPost.jsx'
import Navigation from './Navigation.jsx'

function MainFeed({user, setUser}) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const observerRef = useRef()
    const navigate = useNavigate()

    useEffect(() => {
        fetchPosts()
    }, [page])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const response = await api.getPosts(page)
            if (response.posts) {
                if (page === 1) {
                    setPosts(response.posts)
                } else {
                    setPosts(prev => [...prev, ...response.posts])
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
                // Return success with the updated post data
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
        fetchPosts()
    }

    return (
        <div className="feed-container">
            <Navigation user={user} setUser={setUser}/>

            <div className="feed-content">
                <div className="feed-header">
                    <h1>Social Feed</h1>
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
                        <span className="stat-number">{user.isAdmin ? '👑 Admin' : '👤 User'}</span>
                        <span className="stat-label">Your Role</span>
                    </div>
                </div>

                <div className="posts-feed">
                    {loading && page === 1 ? (
                        <div className="loading-spinner">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="empty-feed">
                            <h2>No posts yet</h2>
                            <p>Be the first to share something!</p>
                            {user.isAdmin && (
                                <button
                                    onClick={() => navigate('/upload')}
                                    className="create-post-btn large"
                                >
                                    Create First Post
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