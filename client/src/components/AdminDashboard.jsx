import {useState, useEffect} from 'react'
import {useNavigate, Navigate} from 'react-router-dom'
import Navigation from './Navigation.jsx'

function AdminDashboard({user}) {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalPosts: 0,
        totalImages: 0,
        totalVideos: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsers()
        fetchStats()
    }, [])

    const fetchUsers = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/stats`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    const toggleAdminStatus = async (userId, currentStatus) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({isAdmin: !currentStatus})
            })

            if (response.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error updating user:', error)
        }
    }

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return

        try {
            const apiUrl = import.meta.env.VITE_API_URL
            const response = await fetch(`${apiUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            })

            if (response.ok) {
                fetchUsers()
                fetchStats()
            }
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    if (!user.isAdmin) {
        return <Navigate to="/feed"/>
    }

    return (
        <div className="admin-container">
            <Navigation user={user} setUser={() => {
            }}/>

            <div className="admin-content">
                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <button onClick={() => navigate('/feed')} className="back-btn">
                        ← Back to Feed
                    </button>
                </div>

                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Admins</h3>
                        <p className="stat-number">{stats.totalAdmins}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Posts</h3>
                        <p className="stat-number">{stats.totalPosts}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Images/Videos</h3>
                        <p className="stat-number">{stats.totalImages}/{stats.totalVideos}</p>
                    </div>
                </div>

                <div className="users-table-container">
                    <h2>User Management</h2>
                    {loading ? (
                        <p>Loading users...</p>
                    ) : (
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th>Email</th>
                                <th>Registered</th>
                                <th>Status</th>
                                <th>Posts</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map(userItem => (
                                <tr key={userItem._id}>
                                    <td>{userItem.email}</td>
                                    <td>{new Date(userItem.createdAt).toLocaleDateString()}</td>
                                    <td>
                                            <span className={`status-badge ${userItem.isAdmin ? 'admin' : 'user'}`}>
                                                {userItem.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                    </td>
                                    <td>{userItem.postCount || 0}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => toggleAdminStatus(userItem._id, userItem.isAdmin)}
                                                className={`toggle-btn ${userItem.isAdmin ? 'remove-admin' : 'make-admin'}`}
                                            >
                                                {userItem.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                            </button>
                                            {user.email !== userItem.email && (
                                                <button
                                                    onClick={() => deleteUser(userItem._id)}
                                                    className="delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="admin-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons-horizontal">
                        <button className="admin-btn" onClick={() => navigate('/upload')}>
                            Create Post
                        </button>
                        <button className="admin-btn" onClick={() => navigate('/feed')}>
                            View Feed
                        </button>
                        <button className="admin-btn" onClick={() => {
                            fetchUsers()
                            fetchStats()
                        }}>
                            Refresh Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard