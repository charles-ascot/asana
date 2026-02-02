import React from 'react'
import { useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
  const navigate = useNavigate()

  const handleSetup = () => {
    navigate('/settings')
  }

  return (
    <div className="login-screen">
      <div className="glass-panel login-panel">
        <div className="logo-section">
          <h1 className="app-title">CHIMERA</h1>
          <p className="app-subtitle">Task Management Hub</p>
        </div>

        <div className="separator"></div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>
            Welcome to Chimera. To get started, please configure your Asana integration.
          </p>
        </div>

        <button className="button-primary" onClick={handleSetup}>
          Configure Settings
        </button>

        <div className="copyright">
          © 2026 Chimera • Powered by Asana
        </div>
      </div>
    </div>
  )
}

export default Login
