import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has valid settings
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setIsAuthenticated(data.configured)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="app">
        <div className="image-bg" />
        <div className="login-overlay" />
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <div className="image-bg" />
        <div className="login-overlay" />
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/settings" 
            element={<Settings onSave={() => setIsAuthenticated(true)} />} 
          />
          <Route 
            path="/login" 
            element={<Login onLogin={() => setIsAuthenticated(true)} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
