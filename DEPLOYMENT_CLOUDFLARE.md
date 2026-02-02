# Cloudflare Pages Deployment Guide

## Prerequisites

1. Cloudflare account
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Domain configured in Cloudflare (optional)

## Deployment Options

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

This is the easiest method and enables automatic deployments on git push.

#### 1. Connect Your Repository

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **"Create a project"**
3. Click **"Connect to Git"**
4. Authorize Cloudflare to access your repository
5. Select your repository

#### 2. Configure Build Settings

- **Project name**: `chimera-dashboard`
- **Production branch**: `main` (or your default branch)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `frontend`

#### 3. Environment Variables

Add these environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.run.app` | Your Cloud Run backend URL |
| `NODE_VERSION` | `20` | Node.js version |

#### 4. Deploy

Click **"Save and Deploy"**

Your site will be available at: `https://chimera-dashboard.pages.dev`

### Option 2: Deploy via Wrangler CLI

#### 1. Install Wrangler

```bash
npm install -g wrangler
```

#### 2. Login to Cloudflare

```bash
wrangler login
```

#### 3. Update Frontend Configuration

First, update your frontend to use the production API URL.

**Option A: Environment Variable**

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-url.run.app
```

Update your API calls in the frontend code:

```javascript
// Before
const response = await fetch('/api/tasks')

// After
const API_URL = import.meta.env.VITE_API_URL || ''
const response = await fetch(`${API_URL}/api/tasks`)
```

**Option B: Vite Config (for development proxy only)**

The Vite proxy only works in development mode. For production, you need to update all fetch calls.

#### 4. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

#### 5. Deploy to Pages

```bash
wrangler pages deploy dist --project-name chimera-dashboard
```

On first deployment, you'll be prompted to create the project.

### Option 3: Direct Upload

#### 1. Build Locally

```bash
cd frontend
npm install
npm run build
```

#### 2. Upload via Dashboard

1. Go to Cloudflare Pages Dashboard
2. Click **"Create a project"**
3. Choose **"Direct Upload"**
4. Drag and drop the `dist` folder
5. Click **"Deploy site"**

## Post-Deployment Configuration

### 1. Update API URL in Frontend

You need to ensure all API calls point to your Cloud Run backend.

Edit `frontend/src/App.jsx` and all component files to replace:

```javascript
// Change from:
fetch('/api/tasks')

// To:
const API_URL = import.meta.env.VITE_API_URL || ''
fetch(`${API_URL}/api/tasks`)
```

Or create a utility file `frontend/src/utils/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || ''

export const apiUrl = (path) => `${API_URL}${path}`

// Usage:
import { apiUrl } from './utils/api'
fetch(apiUrl('/api/tasks'))
```

### 2. Configure CORS on Backend

Update your backend `server.js` to allow your Cloudflare Pages domain:

```javascript
import cors from 'cors'

const corsOptions = {
  origin: [
    'https://chimera-dashboard.pages.dev',
    'https://your-custom-domain.com',
    'http://localhost:3000' // for development
  ],
  credentials: true
}

app.use(cors(corsOptions))
```

Redeploy your backend after making this change.

### 3. Set Up Custom Domain

#### Add Custom Domain

1. Go to your Pages project
2. Click **"Custom domains"**
3. Click **"Set up a custom domain"**
4. Enter your domain (e.g., `chimera.yourdomain.com`)
5. Cloudflare will automatically configure DNS if the domain is in Cloudflare

#### SSL Certificate

Cloudflare automatically provisions SSL certificates for your custom domain.

## Advanced Configuration

### 1. Functions (Cloudflare Workers)

You can add serverless functions to your Pages project:

Create `frontend/functions/api/hello.js`:

```javascript
export async function onRequest(context) {
  return new Response('Hello from Cloudflare Workers!')
}
```

This will be available at: `https://your-site.pages.dev/api/hello`

### 2. Redirects

Create `frontend/public/_redirects`:

```
# Redirect /old-url to /new-url
/old-url /new-url 301

# Fallback for SPA
/* /index.html 200
```

### 3. Headers

Create `frontend/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  
/api/*
  Access-Control-Allow-Origin: *
```

### 4. Preview Deployments

Cloudflare automatically creates preview deployments for each pull request:

- Main branch: `https://chimera-dashboard.pages.dev`
- PR #123: `https://123.chimera-dashboard.pages.dev`

### 5. Build Configuration

Create `frontend/wrangler.toml`:

```toml
name = "chimera-dashboard"
pages_build_output_dir = "dist"

[build]
command = "npm run build"

[build.environment_variables]
NODE_VERSION = "20"
VITE_API_URL = "https://your-backend-url.run.app"
```

## Continuous Deployment

### Automatic Deployments

Once connected to Git:
1. Push to your main branch → Production deployment
2. Push to other branches → Preview deployment
3. Create PR → Preview deployment with comment

### Manual Deployments

```bash
# Deploy production
wrangler pages deploy dist --project-name chimera-dashboard --branch main

# Deploy preview
wrangler pages deploy dist --project-name chimera-dashboard --branch preview
```

## Monitoring and Analytics

### 1. Web Analytics

Enable Cloudflare Web Analytics:

1. Go to your Pages project
2. Click **"Analytics"**
3. Enable **"Web Analytics"**

### 2. Deployment Logs

View build and deployment logs in the Pages dashboard under **"Deployments"**.

### 3. Real User Monitoring

Add the Cloudflare analytics script to your `index.html`:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "your-token-here"}'></script>
```

## Performance Optimization

### 1. Enable HTTP/3

Automatically enabled by Cloudflare.

### 2. Enable Brotli Compression

Automatically enabled by Cloudflare.

### 3. Configure Caching

Add cache headers in `frontend/public/_headers`:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache
```

### 4. Optimize Images

Use Cloudflare Image Resizing (paid feature) or optimize images before deployment.

## Troubleshooting

### Build Failures

Check build logs in the Pages dashboard. Common issues:

1. **Node version mismatch**: Set `NODE_VERSION` environment variable
2. **Missing dependencies**: Ensure `package.json` is correct
3. **Build command fails**: Test locally with `npm run build`

### API Calls Failing

1. **CORS errors**: Update backend CORS configuration
2. **404 errors**: Ensure `VITE_API_URL` is set correctly
3. **Network errors**: Check that backend is running and accessible

### Routing Issues (404 on refresh)

Add `frontend/public/_redirects`:

```
/* /index.html 200
```

This ensures all routes are handled by React Router.

## Rollback

### Via Dashboard

1. Go to **"Deployments"**
2. Find the working deployment
3. Click **"⋯"** → **"Rollback to this deployment"**

### Via CLI

```bash
wrangler pages deployment tail --project-name chimera-dashboard
# Find the deployment ID of the version you want
wrangler pages deployment create --project-name chimera-dashboard --branch main
```

## Cost

Cloudflare Pages is **FREE** for:
- Unlimited sites
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month

Paid plans ($20/month) include:
- 5,000 builds per month
- Concurrent builds
- Advanced preview deployments

## Security

### 1. Environment Variables

Never commit sensitive data. Use Cloudflare's environment variables for:
- API keys
- Secret tokens
- Backend URLs

### 2. Access Policies

Control who can access preview deployments:

1. Go to **"Settings"** → **"Access policies"**
2. Set up Cloudflare Access for preview deployments

### 3. Branch Protection

Protect your production branch:

1. Go to **"Settings"** → **"Builds & deployments"**
2. Set up branch protection rules

## Clean Up

To delete the Pages project:

1. Go to your Pages project
2. Click **"Settings"**
3. Scroll to **"Delete project"**
4. Confirm deletion

Or via CLI:

```bash
wrangler pages project delete chimera-dashboard
```
