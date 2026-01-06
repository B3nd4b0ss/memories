import {useState, useEffect} from 'react';
import {api} from '../utils/api.js';

function MediaCarousel({media, postId, userToken}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mediaUrls, setMediaUrls] = useState([]);

    useEffect(() => {
        const fetchAllMedia = async () => {
            const urls = await Promise.all(
                media.map(item => api.fetchMedia(postId, item.filename, userToken))
            );
            setMediaUrls(urls);
        };
        fetchAllMedia();

        // Cleanup blob URLs on unmount
        return () => {
            mediaUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [media, postId, userToken]);

    const nextSlide = () => setCurrentIndex(prev => (prev + 1) % media.length);
    const prevSlide = () => setCurrentIndex(prev => (prev - 1 + media.length) % media.length);

    if (!media || media.length === 0) return null;

    return (
        <div className="media-carousel">
            <div className="carousel-container">
                {media.map((item, index) => (
                    <div
                        key={item._id || index}
                        className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
                    >
                        {item.type?.startsWith('image/') ? (
                            <img
                                src={mediaUrls[index]}
                                alt={`Media ${index + 1}`}
                                className="media-item"
                            />
                        ) : (
                            <video controls className="media-item">
                                <source src={mediaUrls[index]} type={item.type}/>
                            </video>
                        )}
                    </div>
                ))}
            </div>

            {media.length > 1 && (
                <>
                    <button className="carousel-btn prev" onClick={prevSlide}>‹</button>
                    <button className="carousel-btn next" onClick={nextSlide}>›</button>
                    <div className="carousel-dots">
                        {media.map((_, index) => (
                            <button
                                key={index}
                                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </div>
                    <div className="carousel-counter">{currentIndex + 1} / {media.length}</div>
                </>
            )}
        </div>
    );
}

export default MediaCarousel;
