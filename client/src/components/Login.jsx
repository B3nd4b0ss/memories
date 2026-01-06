import {useState} from 'react'
import {useNavigate} from 'react-router-dom'

function Login({setUser}) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const endpoint = isRegistering ? 'register' : 'login'
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

        try {
            const response = await fetch(`${apiUrl}/${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password})
            })

            const data = await response.json()

            if (response.ok) {
                setUser({
                    email: data.email || email,
                    isAdmin: data.isAdmin || false,
                    isAuthenticated: true,
                    token: data.token
                })
                navigate('/feed')
            } else {
                setError(data.error || 'An error occurred')
            }
        } catch (error) {
            console.error('Network error:', error)
            setError('Connection error to server')
        }
    }

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>{isRegistering ? 'Register' : 'Login'}</h2>
                {error && <div className="error-message">{error}</div>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                />
                <button type="submit" className="submit-btn">
                    {isRegistering ? 'Create Account' : 'Login'}
                </button>
                <p
                    onClick={() => {
                        setIsRegistering(!isRegistering)
                        setError('')
                    }}
                    className="toggle-text"
                >
                    {isRegistering ? 'Already have an account? Login' : 'No account yet? Register'}
                </p>
            </form>
        </div>
    )
}

export default Login