import express from 'express'
import cors from 'cors'
import Asana from 'asana'
import dotenv from 'dotenv'

dotenv.config()

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

// Helper to configure Asana client with token
function configureAsana(token) {
  const client = Asana.ApiClient.instance
  const tokenAuth = client.authentications['token']
  tokenAuth.accessToken = token || appSettings.asanaToken
  return client
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

    if (!asanaToken) {
      return res.status(400).json({ error: 'No token provided' })
    }

    const cleanToken = asanaToken.trim()
    console.log('Testing Asana connection with token length:', cleanToken.length)

    configureAsana(cleanToken)
    const usersApi = new Asana.UsersApi()

    const result = await usersApi.getUser('me', {})
    const me = result.data

    console.log('Asana connection successful for user:', me.name)
    res.json({
      success: true,
      user: me.name,
      email: me.email
    })
  } catch (error) {
    console.error('Asana test failed:', error.message)
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
    if (!token) {
      return res.status(401).json({ error: 'No Asana token provided' })
    }

    configureAsana(token)
    const workspacesApi = new Asana.WorkspacesApi()

    const result = await workspacesApi.getWorkspaces({})
    res.json(result.data || [])
  } catch (error) {
    console.error('Failed to fetch workspaces:', error.message)
    res.status(401).json({ error: 'Invalid token or failed to fetch workspaces' })
  }
})

// Get projects in workspace
app.get('/api/asana/projects', async (req, res) => {
  try {
    const { workspace } = req.query
    const token = req.headers['x-asana-token']

    configureAsana(token)
    const projectsApi = new Asana.ProjectsApi()

    const result = await projectsApi.getProjects({
      workspace,
      archived: false
    })
    res.json(result.data || [])
  } catch (error) {
    console.error('Failed to fetch projects:', error.message)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get all projects (for dashboard)
app.get('/api/projects', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json([])
    }

    configureAsana()
    const projectsApi = new Asana.ProjectsApi()

    const result = await projectsApi.getProjects({
      workspace: appSettings.asanaWorkspace,
      archived: false
    })
    res.json(result.data || [])
  } catch (error) {
    console.error('Failed to fetch projects:', error.message)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json([])
    }

    configureAsana()
    const usersApi = new Asana.UsersApi()
    const tasksApi = new Asana.TasksApi()

    const meResult = await usersApi.getUser('me', {})
    const me = meResult.data

    const result = await tasksApi.getTasks({
      workspace: appSettings.asanaWorkspace,
      assignee: me.gid,
      opt_fields: 'name,completed,due_on,assignee,assignee.name,projects,notes'
    })

    const taskList = result.data || []

    // Sort: incomplete tasks first
    taskList.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return 0
    })

    res.json(taskList.slice(0, 50))
  } catch (error) {
    console.error('Failed to fetch tasks:', error.message)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Get task statistics
app.get('/api/tasks/stats', async (req, res) => {
  try {
    if (!appSettings.asanaWorkspace) {
      return res.json({ active: 0, completed: 0 })
    }

    configureAsana()
    const usersApi = new Asana.UsersApi()
    const tasksApi = new Asana.TasksApi()

    const meResult = await usersApi.getUser('me', {})
    const me = meResult.data

    const result = await tasksApi.getTasks({
      workspace: appSettings.asanaWorkspace,
      assignee: me.gid,
      opt_fields: 'completed'
    })

    const tasks = result.data || []
    let active = 0
    let completed = 0

    for (const task of tasks) {
      if (task.completed) {
        completed++
      } else {
        active++
      }
    }

    res.json({ active, completed })
  } catch (error) {
    console.error('Failed to fetch task stats:', error.message)
    res.status(500).json({ error: 'Failed to fetch task stats' })
  }
})

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { name, notes, project, due_on } = req.body

    configureAsana()
    const tasksApi = new Asana.TasksApi()

    const taskData = {
      name,
      workspace: appSettings.asanaWorkspace,
      notes: notes || ''
    }

    const projectId = project || appSettings.asanaProject
    if (projectId) {
      taskData.projects = [projectId]
    }

    if (due_on) {
      taskData.due_on = due_on
    }

    const result = await tasksApi.createTask({ body: { data: taskData } })
    res.json(result.data)
  } catch (error) {
    console.error('Failed to create task:', error.message)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Complete task
app.put('/api/tasks/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params

    configureAsana()
    const tasksApi = new Asana.TasksApi()

    const result = await tasksApi.updateTask(taskId, {
      body: { data: { completed: true } }
    })
    res.json(result.data)
  } catch (error) {
    console.error('Failed to complete task:', error.message)
    res.status(500).json({ error: 'Failed to complete task' })
  }
})

// Update task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const updates = req.body

    configureAsana()
    const tasksApi = new Asana.TasksApi()

    const result = await tasksApi.updateTask(taskId, {
      body: { data: updates }
    })
    res.json(result.data)
  } catch (error) {
    console.error('Failed to update task:', error.message)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params

    configureAsana()
    const tasksApi = new Asana.TasksApi()

    await tasksApi.deleteTask(taskId)
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error.message)
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
