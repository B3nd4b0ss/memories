import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import Navigation from './Navigation.jsx'

function Settings({user, setUser}) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState({type: '', text: ''})
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setMessage({type: 'error', text: 'New passwords do not match'})
            return
        }

        if (newPassword.length < 6) {
            setMessage({type: 'error', text: 'Password must be at least 6 characters'})
            return
        }

        setLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            setMessage({
                type: 'success',
                text: 'Password updated successfully!'
            })

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to update password'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            setUser(null)
            navigate('/')
        }
    }

    return (
        <div className="settings-container">
            <Navigation user={user} setUser={setUser}/>

            <div className="settings-content">
                <div className="settings-header">
                    <h1>Account Settings</h1>
                    <button onClick={() => navigate('/feed')} className="back-btn">
                        ← Back to Feed
                    </button>
                </div>

                <div className="settings-grid">
                    <div className="settings-section">
                        <h2>Profile Information</h2>
                        <div className="profile-info">
                            <div className="profile-avatar">
                                {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="profile-details">
                                <h3>{user.email}</h3>
                                <p className="role-badge">
                                    {user.isAdmin ? '👑 Admin User' : '👤 Regular User'}
                                </p>
                                <p className="member-since">
                                    Member since: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2>Change Password</h2>
                        <form onSubmit={handlePasswordChange} className="password-form">
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm new password"
                                />
                            </div>

                            {message.text && (
                                <div className={`message ${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                    </div>

                    <div className="settings-section">
                        <h2>Preferences</h2>
                        <div className="preferences">
                            <div className="preference-item">
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked/>
                                    <span className="slider"></span>
                                </label>
                                <div>
                                    <h4>Email Notifications</h4>
                                    <p>Receive email updates on new posts</p>
                                </div>
                            </div>

                            <div className="preference-item">
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked/>
                                    <span className="slider"></span>
                                </label>
                                <div>
                                    <h4>Dark Mode</h4>
                                    <p>Use dark theme</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="settings-section danger-zone">
                        <h2>Danger Zone</h2>
                        <div className="danger-actions">
                            <button
                                onClick={handleDeleteAccount}
                                className="delete-account-btn"
                            >
                                Delete My Account
                            </button>
                            <p className="warning-text">
                                This will permanently delete your account and all your data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings