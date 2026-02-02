import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Plus,
  List,
  Sparkles,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { API_BASE } from '../config'

function Dashboard() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    active: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    loadDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const [tasksRes, statsRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks`),
        fetch(`${API_BASE}/api/tasks/stats`),
        fetch(`${API_BASE}/api/projects`)
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    const taskName = prompt('Enter task name:')
    if (!taskName) return

    try {
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: taskName,
          project: selectedProject 
        })
      })

      if (response.ok) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}/complete`, {
        method: 'PUT'
      })

      if (response.ok) {
        loadDashboardData()
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1 className="header-title">CHIMERA</h1>
          <p className="header-subtitle">Task Management Hub</p>
        </div>
        <button 
          className="button-logout" 
          onClick={() => navigate('/settings')}
        >
          <Settings size={14} style={{ marginRight: '6px', display: 'inline' }} />
          Settings
        </button>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* Welcome Section */}
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>
            Good Morning 👋
          </h2>
          <p style={{ color: '#888', fontSize: '14px' }}>
            What would you like to accomplish today?
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '20px',
            justifyContent: 'flex-end'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: '700',
                color: '#00D4FF',
                fontFamily: 'Lexend, sans-serif'
              }}>
                {stats.active}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Active Tickets
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: '700',
                color: '#4ade80',
                fontFamily: 'Lexend, sans-serif'
              }}>
                {stats.completed}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ 
            fontSize: '14px',
            color: '#00D4FF',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} />
            Quick Actions
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            <button 
              className="glass-panel"
              onClick={handleCreateTask}
              style={{ 
                cursor: 'pointer',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(10, 15, 30, 0.6)',
                padding: '24px',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Plus size={24} color="#00D4FF" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#fff' }}>
                New Request
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Submit a new task or request
              </div>
            </button>

            <button 
              className="glass-panel"
              onClick={() => loadDashboardData()}
              style={{ 
                cursor: 'pointer',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(10, 15, 30, 0.6)',
                padding: '24px',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <List size={24} color="#e0e0e0" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#fff' }}>
                Task Queue
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Track status of ongoing tasks
              </div>
            </button>

            <button 
              className="glass-panel"
              style={{ 
                cursor: 'pointer',
                border: '1px solid rgba(157, 78, 221, 0.3)',
                background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2) 0%, rgba(157, 78, 221, 0.1) 100%)',
                padding: '24px',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9D4EDD'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Sparkles size={24} color="#9D4EDD" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#fff' }}>
                AI Assistant
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Get AI-powered task insights
              </div>
            </button>

            <button 
              className="glass-panel"
              style={{ 
                cursor: 'pointer',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(10, 15, 30, 0.6)',
                padding: '24px',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00D4FF'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Search size={24} color="#e0e0e0" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#fff' }}>
                Project Search
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Search tasks and projects
              </div>
            </button>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="glass-panel">
          <h3 style={{ 
            fontSize: '14px',
            color: '#00D4FF',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={16} />
            Recent Tasks
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No tasks found. Create your first task to get started!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.slice(0, 10).map((task) => (
                <div 
                  key={task.gid}
                  style={{
                    padding: '16px',
                    background: 'rgba(20, 30, 50, 0.5)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#00D4FF'
                    e.currentTarget.style.background = 'rgba(20, 30, 50, 0.7)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)'
                    e.currentTarget.style.background = 'rgba(20, 30, 50, 0.5)'
                  }}
                >
                  <button
                    onClick={() => handleCompleteTask(task.gid)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} color="#4ade80" />
                    ) : (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(0, 212, 255, 0.5)',
                        borderRadius: '50%'
                      }} />
                    )}
                  </button>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: task.completed ? '#888' : '#e0e0e0',
                      textDecoration: task.completed ? 'line-through' : 'none'
                    }}>
                      {task.name}
                    </div>
                    {task.due_on && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#888',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Calendar size={12} />
                        Due: {format(new Date(task.due_on), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>

                  {task.assignee && (
                    <div style={{
                      fontSize: '12px',
                      color: '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <User size={12} />
                      {task.assignee.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
