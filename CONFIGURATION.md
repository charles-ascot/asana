# Configuration Guide

## Overview

Chimera Dashboard can be configured in multiple ways to suit your deployment needs.

## Configuration Options

### 1. Environment Variables (Backend)

The backend accepts configuration via environment variables. Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=production

# Asana Configuration (Optional - can be set via UI)
ASANA_TOKEN=your_personal_access_token_here
ASANA_WORKSPACE=workspace_gid
ASANA_PROJECT=project_gid
```

#### Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | Number | 8080 | Port the backend server listens on |
| `NODE_ENV` | String | development | Environment mode (development/production) |
| `ASANA_TOKEN` | String | - | Asana Personal Access Token |
| `ASANA_WORKSPACE` | String | - | Default Asana workspace GID |
| `ASANA_PROJECT` | String | - | Default Asana project GID |

### 2. Environment Variables (Frontend)

The frontend uses Vite's environment variables. Create `.env.production` in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=https://your-backend-url.run.app
```

#### Frontend Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_URL` | String | '' (empty) | Backend API base URL |

**Note:** Variables must be prefixed with `VITE_` to be exposed to the frontend.

### 3. In-App Configuration

The most user-friendly way to configure Chimera is through the Settings page:

1. Open the application
2. Click "Configure Settings" or navigate to `/settings`
3. Enter your Asana Personal Access Token
4. Test the connection
5. Select your workspace
6. (Optional) Select a default project
7. Save settings

Settings are persisted in the backend's memory. For production, consider implementing persistent storage (database, Redis, etc.).

## Getting Asana Credentials

### Personal Access Token

1. Go to [Asana Developer Console](https://app.asana.com/0/my-apps)
2. Click on your profile icon → "My Settings"
3. Go to "Apps" tab
4. Click "Manage Developer Apps"
5. Click "Create new token"
6. Give it a name (e.g., "Chimera Dashboard")
7. Copy the token immediately (it won't be shown again)

**Security Note:** Keep your token secure. Anyone with this token can access your Asana account.

### Finding Workspace GID

**Method 1: Via UI**
After entering your token in the Settings page, workspaces will be automatically loaded.

**Method 2: Via API**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.asana.com/api/1.0/workspaces
```

**Method 3: Via Browser**
Go to Asana, the workspace GID is in the URL: `https://app.asana.com/0/WORKSPACE_GID/...`

### Finding Project GID

**Method 1: Via UI**
After selecting a workspace in Settings, projects will be automatically loaded.

**Method 2: Via API**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.asana.com/api/1.0/workspaces/WORKSPACE_GID/projects
```

**Method 3: Via Browser**
Open a project in Asana, the project GID is in the URL: `https://app.asana.com/0/PROJECT_GID/...`

## Configuration for Different Environments

### Development

**Backend (.env):**
```env
PORT=8080
NODE_ENV=development
# Leave Asana credentials empty to configure via UI
```

**Frontend (.env.development):**
```env
VITE_API_URL=http://localhost:8080
```

Run both servers:
```bash
./start.sh
```

### Staging

**Backend:**
Deploy to Cloud Run with environment variables:
```bash
gcloud run deploy chimera-backend-staging \
  --image gcr.io/PROJECT_ID/chimera-backend:staging \
  --set-env-vars="NODE_ENV=staging"
```

**Frontend:**
Deploy to Cloudflare Pages with branch `staging`:
```env
VITE_API_URL=https://chimera-backend-staging-xxxxx.run.app
```

### Production

**Backend:**
Use Google Cloud Secret Manager for sensitive data:
```bash
# Store token in Secret Manager
echo -n "your-token" | gcloud secrets create asana-token --data-file=-

# Deploy with secret
gcloud run deploy chimera-backend \
  --image gcr.io/PROJECT_ID/chimera-backend:latest \
  --set-secrets="ASANA_TOKEN=asana-token:latest"
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://chimera-backend-xxxxx.run.app
```

## Advanced Configuration

### CORS Configuration

Update `backend/server.js` to configure CORS for your domains:

```javascript
import cors from 'cors'

const corsOptions = {
  origin: [
    'https://your-domain.com',
    'https://chimera.pages.dev',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Asana-Token']
}

app.use(cors(corsOptions))
```

### Request Timeout

Configure timeouts for Asana API requests:

```javascript
// In server.js
const client = asana.Client.create({
  defaultHeaders: { 'asana-enable': 'new_user_task_lists' },
  requestTimeout: 30000 // 30 seconds
}).useAccessToken(token)
```

### Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

app.use('/api/', limiter)
```

### Logging

Add structured logging:

```bash
npm install winston
```

```javascript
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Use throughout your app
logger.info('Task created', { taskId: task.gid })
logger.error('Failed to fetch tasks', { error: error.message })
```

### Persistent Storage

For production, implement persistent storage for settings:

**Option 1: Cloud Firestore**
```javascript
import { Firestore } from '@google-cloud/firestore'

const db = new Firestore()
const settingsRef = db.collection('settings').doc('app')

// Save settings
await settingsRef.set(settings)

// Load settings
const doc = await settingsRef.get()
const settings = doc.data()
```

**Option 2: Cloud SQL**
```javascript
import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(process.env.DATABASE_URL)

const Settings = sequelize.define('settings', {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: DataTypes.TEXT
})
```

**Option 3: Redis**
```javascript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Save settings
await redis.set('settings', JSON.stringify(settings))

// Load settings
const settings = JSON.parse(await redis.get('settings'))
```

## Security Best Practices

### 1. Token Storage

Never commit tokens to git:
- Use `.env` files (listed in `.gitignore`)
- Use cloud secret managers
- Use in-app configuration with backend storage

### 2. Token Rotation

Regularly rotate your Asana tokens:
1. Generate new token in Asana
2. Update configuration
3. Revoke old token

### 3. Least Privilege

Create a dedicated Asana account with minimal permissions for the dashboard.

### 4. HTTPS Only

Always use HTTPS in production:
- Cloud Run enforces HTTPS
- Cloudflare provides free SSL

### 5. Input Validation

Validate all user inputs on the backend:

```javascript
import { body, validationResult } from 'express-validator'

app.post('/api/tasks',
  body('name').isString().trim().notEmpty(),
  body('due_on').optional().isISO8601(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    // Process request
  }
)
```

## Troubleshooting Configuration

### Backend not connecting to Asana

1. Verify token is valid:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.asana.com/api/1.0/users/me
```

2. Check token permissions
3. Verify workspace/project GIDs are correct

### Frontend not connecting to backend

1. Check `VITE_API_URL` is set correctly
2. Verify CORS is configured on backend
3. Check browser console for errors
4. Verify backend is running and accessible

### Settings not persisting

In-memory storage is cleared on restart. Implement persistent storage for production.

### CORS errors

1. Update backend CORS configuration
2. Ensure frontend URL is in allowed origins
3. Check that credentials are included in requests

## Configuration Checklist

- [ ] Backend `.env` file created
- [ ] Frontend `.env.production` created
- [ ] Asana token obtained
- [ ] Workspace GID identified
- [ ] CORS configured for your domain
- [ ] SSL certificate configured (automatic on Cloud Run/Cloudflare)
- [ ] Environment variables set in Cloud Run
- [ ] Environment variables set in Cloudflare Pages
- [ ] Settings tested via in-app configuration
- [ ] API connectivity verified
- [ ] Security review completed
