import {useNavigate, useLocation} from 'react-router-dom'

function Navigation({user, setUser}) {
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        setUser(null)
        navigate('/')
    }

    const isActive = (path) => {
        return location.pathname === path ? 'active' : ''
    }

    return (
        <nav className="main-nav">
            <div className="nav-container">
                <div className="nav-brand" onClick={() => navigate('/feed')}>
                    <h1>📷 SocialMedia</h1>
                </div>

                <div className="nav-links">
                    <button
                        className={`nav-link ${isActive('/feed')}`}
                        onClick={() => navigate('/feed')}
                    >
                        🏠 Feed
                    </button>


                    <button
                        className={`nav-link ${isActive('/upload')}`}
                        onClick={() => navigate('/upload')}
                    >
                        ➕ Upload
                    </button>


                    <button
                        className={`nav-link ${isActive('/settings')}`}
                        onClick={() => navigate('/settings')}
                    >
                        ⚙️ Settings
                    </button>

                    {user.isAdmin && (
                        <button
                            className={`nav-link ${isActive('/admin')}`}
                            onClick={() => navigate('/admin')}
                        >
                            👑 Admin
                        </button>
                    )}
                </div>

                <div className="nav-user">
                    <div className="user-info">
                        <span className="user-email">{user.email}</span>
                        <span className="user-role">{user.isAdmin ? '👑 Admin' : '👤 User'}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navigation