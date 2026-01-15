import {useState} from 'react';
import MediaCarousel from './MediaCarousel.jsx';

function FeedPost({post, user, onLike, onDelete, onComment}) {
    const [showFullText, setShowFullText] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []); // Local state for comments

    const isLiked = post.likes?.includes(user.email);
    const hasComments = comments && comments.length > 0;

    const formatDate = (dateString) => {
        if (!dateString) return 'Just now';

        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            if (diffInHours < 1) {
                const minutes = Math.floor(diffInHours * 60);
                return minutes === 0 ? 'Just now' : `${minutes}m ago`;
            }
            return `${Math.floor(diffInHours)}h ago`;
        }
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        try {
            const result = await onComment(post._id, commentText);
            if (result && result.success) {
                const newComment = {
                    userEmail: user.email,
                    text: commentText,
                    createdAt: new Date().toISOString()
                };

                setComments(prev => [newComment, ...prev]);
                setCommentText('');
                setShowCommentInput(false);
                setShowAllComments(true); // Show all comments after posting
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommentSubmit();
        }
    };

    // Sort comments by date (newest first)
    const sortedComments = hasComments ? [...comments].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    }) : [];

    const displayedComments = showAllComments
        ? sortedComments
        : sortedComments.slice(0, 3);

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
                <button className={`like-btn ${isLiked ? 'liked' : ''}`} onClick={() => onLike(post._id)}>
                    ❤️ {post.likes?.length || 0}
                </button>
                <button
                    className={`comment-btn ${showCommentInput ? 'active' : ''}`}
                    onClick={() => setShowCommentInput(!showCommentInput)}
                >
                    💬 {hasComments && `(${comments.length})`}
                </button>
            </div>

            <div className="post-stats">
                <span>{post.likes?.length || 0} likes</span>
                <span>·</span>
                <span>{comments.length || 0} comments</span>
            </div>

            <div className="comments-section">
                {hasComments && (
                    <div className="existing-comments">
                        {displayedComments.map((comment, index) => (
                            <div key={index} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-author">
                                        {comment.userEmail?.split('@')[0]}
                                    </span>
                                    <span className="comment-time">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                <div className="comment-text">{comment.text}</div>
                            </div>
                        ))}

                        {/* Show More / Show Less Button */}
                        {comments.length > 3 && (
                            <button
                                className="view-all-comments-btn"
                                onClick={() => setShowAllComments(!showAllComments)}
                            >
                                {showAllComments
                                    ? `Show less comments`
                                    : `View all ${comments.length} comments`}
                            </button>
                        )}
                    </div>
                )}

                {/* Comment Input */}
                {showCommentInput && (
                    <div className="comment-input-container">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Write a comment..."
                            className="comment-textarea"
                            rows="3"
                            maxLength="500"
                            disabled={isSubmittingComment}
                        />
                        <div className="comment-actions">
                            <button
                                onClick={() => {
                                    setShowCommentInput(false);
                                    setCommentText('');
                                }}
                                className="cancel-comment-btn"
                                disabled={isSubmittingComment}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCommentSubmit}
                                className="submit-comment-btn"
                                disabled={!commentText.trim() || isSubmittingComment}
                            >
                                {isSubmittingComment ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedPost;