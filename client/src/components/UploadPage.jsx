import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import Navigation from './Navigation.jsx'

function UploadPage({user, setUser}) {
    const [files, setFiles] = useState([])
    const [description, setDescription] = useState('')
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState({type: '', text: ''})
    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files)
        const validFiles = selectedFiles.filter(file =>
            file.type.startsWith('image/') || file.type.startsWith('video/')
        )

        if (validFiles.length > 10) {
            setMessage({type: 'error', text: 'Maximum 10 files allowed per post'})
            return
        }

        setFiles(validFiles)
        setMessage({type: '', text: ''})
    }

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const handleUpload = async (e) => {
        e.preventDefault()

        if (!files.length) {
            setMessage({type: 'error', text: 'Please select at least one file'})
            return
        }

        if (description.length > 1000) {
            setMessage({type: 'error', text: 'Description must be less than 1000 characters'})
            return
        }

        setUploading(true)
        const apiUrl = import.meta.env.VITE_API_URL

        const formData = new FormData()
        files.forEach(file => {
            formData.append('media', file)
        })
        formData.append('description', description)
        formData.append('uploaderEmail', user.email)

        try {
            const response = await fetch(`${apiUrl}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({type: 'success', text: 'Post created successfully!'})
                setFiles([])
                setDescription('')

                setTimeout(() => navigate('/feed'), 2000)
            } else {
                setMessage({type: 'error', text: data.error || 'Upload failed'})
            }
        } catch (error) {
            console.error('Upload error:', error)
            setMessage({type: 'error', text: 'Connection error'})
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="upload-page-container">
            <Navigation user={user} setUser={setUser}/>

            <div className="upload-content">
                <div className="upload-header">
                    <h1>Create New Post</h1>
                    <button onClick={() => navigate('/feed')} className="back-btn">
                        ← Back to Feed
                    </button>
                </div>

                <div className="upload-grid">
                    <div className="upload-preview">
                        <h3>Preview</h3>
                        <div className="preview-card">
                            <div className="preview-header">
                                <div className="preview-user">
                                    <div className="preview-avatar">
                                        {user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4>{user.email.split('@')[0]}</h4>
                                        <p>Just now</p>
                                    </div>
                                </div>
                            </div>

                            {description && (
                                <div className="preview-description">
                                    {description}
                                </div>
                            )}

                            {files.length > 0 && (
                                <div className="preview-media">
                                    {files[0].type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(files[0])}
                                            alt="Preview"
                                            className="preview-image"
                                        />
                                    ) : (
                                        <video controls className="preview-video">
                                            <source src={URL.createObjectURL(files[0])}/>
                                        </video>
                                    )}

                                    {files.length > 1 && (
                                        <div className="media-count">
                                            +{files.length - 1} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="upload-form-section">
                        <form onSubmit={handleUpload} className="upload-form">
                            <div className="form-group">
                                <label className="file-upload-label">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className="file-input"
                                    />
                                    <div className="upload-area">
                                        <div className="upload-icon">📁</div>
                                        <h3>Select Files</h3>
                                        <p>Drag & drop or click to browse</p>
                                        <p className="upload-hint">
                                            Supports images (JPG, PNG, GIF) and videos (MP4, WebM)
                                        </p>
                                    </div>
                                </label>

                                {files.length > 0 && (
                                    <div className="selected-files">
                                        <h4>Selected Files ({files.length})</h4>
                                        <div className="files-list">
                                            {files.map((file, index) => (
                                                <div key={index} className="file-item">
                                                    <div className="file-info">
                                                        <span className="file-name">{file.name}</span>
                                                        <span className="file-size">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="remove-file-btn"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    placeholder="What's on your mind? (Optional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="6"
                                    maxLength="1000"
                                    className="description-textarea"
                                />
                                <div className="char-counter">
                                    {description.length}/1000 characters
                                </div>
                            </div>

                            {message.text && (
                                <div className={`message ${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => navigate('/feed')}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={uploading || !files.length}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Create Post'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UploadPage