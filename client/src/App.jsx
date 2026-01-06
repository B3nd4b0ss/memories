import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import './App.css'

// Import Components
import Login from './components/Login.jsx'
import MainFeed from './components/MainFeed.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Settings from './components/Settings.jsx'
import UploadPage from './components/UploadPage.jsx'

function App() {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user')
        return savedUser ? JSON.parse(savedUser) : null
    })

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    }, [user])

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    user?.isAuthenticated ?
                        <Navigate to="/feed"/> :
                        <Login setUser={setUser}/>
                }/>
                <Route
                    path="/feed"
                    element={
                        user?.isAuthenticated ?
                            <MainFeed user={user} setUser={setUser}/> :
                            <Navigate to="/"/>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        user?.isAuthenticated ?
                            <Settings user={user} setUser={setUser}/> :
                            <Navigate to="/"/>
                    }
                />
                <Route
                    path="/upload"
                    element={
                        user?.isAuthenticated ?
                            <UploadPage user={user} setUser={setUser}/> :
                            <Navigate to="/feed"/>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        user?.isAuthenticated && user?.isAdmin ?
                            <AdminDashboard user={user}/> :
                            <Navigate to="/feed"/>
                    }
                />
            </Routes>
        </Router>
    )
}

export default App