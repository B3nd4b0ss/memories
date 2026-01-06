import {useState} from 'react';
import MediaCarousel from './MediaCarousel.jsx';

function FeedPost({post, user, onLike, onDelete}) {
    const [showFullText, setShowFullText] = useState(false);
    const isLiked = post.likes?.includes(user.email);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            if (diffInHours < 1) return `${Math.floor(diffInHours * 60)}m ago`;
            return `${Math.floor(diffInHours)}h ago`;
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-user">
                    <div className="user-avatar">{post.uploaderEmail?.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <span className="user-name">{post.uploaderEmail?.split('@')[0]}</span>
                        <span className="post-time">{formatDate(post.createdAt)}</span>
                    </div>
                </div>
                {(user.isAdmin || user.email === post.uploaderEmail) && (
                    <button onClick={onDelete} className="delete-post-btn" title="Delete post">✕</button>
                )}
            </div>

            {post.description && (
                <div className="post-text">
                    {post.description.length > 200 && !showFullText ? (
                        <>
                            {post.description.substring(0, 200)}...
                            <button className="read-more-btn" onClick={() => setShowFullText(true)}>Read more</button>
                        </>
                    ) : post.description}
                </div>
            )}

            {post.media?.length > 0 && (
                <MediaCarousel media={post.media} postId={post._id} userToken={user.token}/>
            )}

            <div className="post-actions">
                <button className={`like-btn ${isLiked ? 'liked' : ''}`} onClick={onLike}>
                    ❤️ {post.likes?.length || 0}
                </button>
            </div>

            <div className="post-stats">
                <span>{post.likes?.length || 0} likes</span>
                <span>·</span>
                <span>{post.comments?.length || 0} comments</span>
            </div>
        </div>
    );
}

export default FeedPost;
