import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, CheckCircle2 } from 'lucide-react'

function Settings({ onSave }) {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    asanaToken: '',
    asanaWorkspace: '',
    asanaProject: ''
  })
  const [workspaces, setWorkspaces] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        
        if (data.asanaToken) {
          loadWorkspaces(data.asanaToken)
        }
        if (data.asanaWorkspace) {
          loadProjects(data.asanaToken, data.asanaWorkspace)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadWorkspaces = async (token) => {
    try {
      const response = await fetch('/api/asana/workspaces', {
        headers: {
          'X-Asana-Token': token
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data)
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    }
  }

  const loadProjects = async (token, workspaceId) => {
    try {
      const response = await fetch(`/api/asana/projects?workspace=${workspaceId}`, {
        headers: {
          'X-Asana-Token': token
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    
    // When token changes, load workspaces
    if (field === 'asanaToken' && value) {
      loadWorkspaces(value)
    }
    
    // When workspace changes, load projects
    if (field === 'asanaWorkspace' && value) {
      loadProjects(settings.asanaToken, value)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setTestStatus(null)
    setErrorMessage('')

    try {
      const response = await fetch('/api/asana/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        setTestStatus('success')
        setSuccessMessage('Connection successful!')
      } else {
        setTestStatus('error')
        setErrorMessage(data.error || 'Connection failed')
      }
    } catch (error) {
      setTestStatus('error')
      setErrorMessage('Failed to test connection')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSuccessMessage('Settings saved successfully!')
        setTimeout(() => {
          onSave()
          navigate('/')
        }, 1500)
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to save settings')
      }
    } catch (error) {
      setErrorMessage('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="header">
        <div className="header-left">
          <h1 className="header-title">SETTINGS</h1>
          <p className="header-subtitle">Configure Asana Integration</p>
        </div>
        <button 
          className="button-logout" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={14} style={{ marginRight: '6px', display: 'inline' }} />
          Back
        </button>
      </div>

      <div className="content">
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {successMessage && (
            <div className="success-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#00D4FF',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Asana Configuration
            </h3>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
              Configure your Asana Personal Access Token and workspace to connect Chimera with Asana.
              You can generate a token from your Asana account settings.
            </p>

            <div className="form-group">
              <label className="form-label">Asana Personal Access Token</label>
              <input
                type="password"
                className="form-input"
                placeholder="1/1234567890abcdef:1234567890abcdef"
                value={settings.asanaToken}
                onChange={(e) => handleInputChange('asanaToken', e.target.value)}
              />
              <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                Get your token from{' '}
                <a 
                  href="https://app.asana.com/0/my-apps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#00D4FF' }}
                >
                  Asana Developer Console
                </a>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Workspace</label>
              <select
                className="form-input"
                value={settings.asanaWorkspace}
                onChange={(e) => handleInputChange('asanaWorkspace', e.target.value)}
                disabled={!settings.asanaToken || workspaces.length === 0}
              >
                <option value="">Select a workspace...</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.gid} value={workspace.gid}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Project (Optional)</label>
              <select
                className="form-input"
                value={settings.asanaProject}
                onChange={(e) => handleInputChange('asanaProject', e.target.value)}
                disabled={!settings.asanaWorkspace || projects.length === 0}
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.gid} value={project.gid}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                Tasks created from the dashboard will be added to this project by default
              </p>
            </div>
          </div>

          {testStatus === 'success' && (
            <div className="success-message" style={{ marginBottom: '20px' }}>
              ✓ Connection test successful! You can now save your settings.
            </div>
          )}

          {testStatus === 'error' && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              ✗ Connection test failed. Please check your token and try again.
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="button-check"
              onClick={handleTestConnection}
              disabled={!settings.asanaToken || loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              className="button-primary"
              onClick={handleSave}
              disabled={!settings.asanaToken || !settings.asanaWorkspace || loading}
              style={{ flex: 1 }}
            >
              <Save size={14} style={{ marginRight: '6px', display: 'inline' }} />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="separator" style={{ margin: '30px 0' }}></div>

          <div style={{ fontSize: '12px', color: '#888' }}>
            <h4 style={{ color: '#00D4FF', marginBottom: '12px', fontSize: '13px' }}>
              About Asana Integration
            </h4>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Your Asana token is stored securely and never shared</li>
              <li>Chimera can read and create tasks in your selected workspace</li>
              <li>You can change these settings at any time</li>
              <li>For security, we recommend creating a dedicated service account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
