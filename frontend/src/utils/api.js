// API utility for making requests to the backend
// Centralizes all API calls and handles errors consistently

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      data.error || `Request failed with status ${response.status}`,
      response.status,
      data
    )
  }
  
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  return response.text()
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }
  
  try {
    const response = await fetch(url, config)
    return await handleResponse(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error or server is unavailable', 0, {})
  }
}

// Settings API
export const settingsApi = {
  get: () => apiRequest('/api/settings'),
  save: (settings) => apiRequest('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
}

// Asana API
export const asanaApi = {
  test: (settings) => apiRequest('/api/asana/test', {
    method: 'POST',
    body: JSON.stringify(settings)
  }),
  getWorkspaces: (token) => apiRequest('/api/asana/workspaces', {
    headers: { 'X-Asana-Token': token }
  }),
  getProjects: (token, workspaceId) => apiRequest(
    `/api/asana/projects?workspace=${workspaceId}`,
    { headers: { 'X-Asana-Token': token } }
  )
}

// Tasks API
export const tasksApi = {
  getAll: () => apiRequest('/api/tasks'),
  getStats: () => apiRequest('/api/tasks/stats'),
  create: (taskData) => apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  }),
  update: (taskId, updates) => apiRequest(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),
  complete: (taskId) => apiRequest(`/api/tasks/${taskId}/complete`, {
    method: 'PUT'
  }),
  delete: (taskId) => apiRequest(`/api/tasks/${taskId}`, {
    method: 'DELETE'
  })
}

// Projects API
export const projectsApi = {
  getAll: () => apiRequest('/api/projects')
}

// Health check
export const healthCheck = () => apiRequest('/api/health')

// Export everything as default as well
export default {
  settings: settingsApi,
  asana: asanaApi,
  tasks: tasksApi,
  projects: projectsApi,
  health: healthCheck,
  ApiError
}
