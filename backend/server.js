import express from 'express'
import cors from 'cors'
import asana from 'asana'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

// Middleware
app.use(cors())
app.use(express.json())

// In-memory settings storage (in production, use a database)
let appSettings = {
  asanaToken: process.env.ASANA_TOKEN || '',
  asanaWorkspace: process.env.ASANA_WORKSPACE || '',
  asanaProject: process.env.ASANA_PROJECT || ''
}

// Helper to create Asana client
function createAsanaClient(token) {
  return asana.Client.create({
    defaultHeaders: { 'asana-enable': 'new_user_task_lists' }
  }).useAccessToken(token || appSettings.asanaToken)
}

// Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    res.json({
      ...appSettings,
      configured: !!appSettings.asanaToken && !!appSettings.asanaWorkspace
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

app.post('/api/settings', async (req, res) => {
  try {
    const { asanaToken, asanaWorkspace, asanaProject } = req.body
    
    appSettings = {
      asanaToken,
      asanaWorkspace,
      asanaProject: asanaProject || ''
    }
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

// Asana test connection
app.post('/api/asana/test', async (req, res) => {
  try {
    const { asanaToken } = req.body
    const client = createAsanaClient(asanaToken)
    
    // Test connection by fetching user info
    const me = await client.users.me()
    
    res.json({ 
      success: true, 
      user: me.name,
      email: me.email 
    })
  } catch (error) {
    console.error('Asana test failed:', error)
    res.status(400).json({ 
      error: 'Invalid Asana token or connection failed',
      details: error.message 
    })
  }
})

// Get workspaces
app.get('/api/asana/workspaces', async (req, res) => {
  try {
    const token = req.headers['x-asana-token']
    const client = createAsanaClient(token)
    
    const workspaces = await client.workspaces.findAll()
    const workspaceList = []
    
    for await (const workspace of workspaces) {
      workspaceList.push(workspace)
    }
    
    res.json(workspaceList)
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)
    res.status(500).json({ error: 'Failed to fetch workspaces' })
  }
})

// Get projects in workspace
app.get('/api/asana/projects', async (req, res) => {
  try {
    const { workspace } = req.query
    const token = req.headers['x-asana-token']
    const client = createAsanaClient(token)
    
    const projects = await client.projects.findAll({
      workspace,
      archived: false
    })
    
    const projectList = []
    for await (const project of projects) {
      projectList.push(project)
    }
    
    res.json(projectList)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get all projects (for dashboard)
app.get('/api/projects', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json([])
    }
    
    const client = createAsanaClient()
    const projects = await client.projects.findAll({
      workspace: appSettings.asanaWorkspace,
      archived: false
    })
    
    const projectList = []
    for await (const project of projects) {
      projectList.push(project)
    }
    
    res.json(projectList)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json([])
    }
    
    const client = createAsanaClient()
    const me = await client.users.me()
    
    // Get tasks assigned to the current user
    const tasks = await client.tasks.findAll({
      workspace: appSettings.asanaWorkspace,
      assignee: me.gid,
      opt_fields: 'name,completed,due_on,assignee,projects,notes'
    })
    
    const taskList = []
    for await (const task of tasks) {
      taskList.push(task)
    }
    
    // Sort by created date (most recent first)
    taskList.sort((a, b) => {
      // Incomplete tasks first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return 0
    })
    
    res.json(taskList.slice(0, 50)) // Limit to 50 tasks
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Get task statistics
app.get('/api/tasks/stats', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json({ active: 0, completed: 0 })
    }
    
    const client = createAsanaClient()
    const me = await client.users.me()
    
    // Get all tasks
    const tasks = await client.tasks.findAll({
      workspace: appSettings.asanaWorkspace,
      assignee: me.gid,
      opt_fields: 'completed'
    })
    
    let active = 0
    let completed = 0
    
    for await (const task of tasks) {
      if (task.completed) {
        completed++
      } else {
        active++
      }
    }
    
    res.json({ active, completed })
  } catch (error) {
    console.error('Failed to fetch task stats:', error)
    res.status(500).json({ error: 'Failed to fetch task stats' })
  }
})

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { name, notes, project, due_on } = req.body
    const client = createAsanaClient()
    
    const taskData = {
      name,
      workspace: appSettings.asanaWorkspace,
      notes: notes || ''
    }
    
    // Add to project if specified or use default
    const projectId = project || appSettings.asanaProject
    if (projectId) {
      taskData.projects = [projectId]
    }
    
    if (due_on) {
      taskData.due_on = due_on
    }
    
    const task = await client.tasks.create(taskData)
    res.json(task)
  } catch (error) {
    console.error('Failed to create task:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Complete task
app.put('/api/tasks/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params
    const client = createAsanaClient()
    
    const task = await client.tasks.update(taskId, {
      completed: true
    })
    
    res.json(task)
  } catch (error) {
    console.error('Failed to complete task:', error)
    res.status(500).json({ error: 'Failed to complete task' })
  }
})

// Update task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = req.body
    const client = createAsanaClient()
    
    const task = await client.tasks.update(taskId, updates)
    res.json(task)
  } catch (error) {
    console.error('Failed to update task:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const client = createAsanaClient()
    
    await client.tasks.delete(taskId)
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    configured: !!appSettings.asanaToken && !!appSettings.asanaWorkspace
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chimera Backend running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  
  if (appSettings.asanaToken) {
    console.log('✅ Asana configured')
  } else {
    console.log('⚠️  Asana not configured - configure via Settings page')
  }
})

export default app
