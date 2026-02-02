# Chimera Dashboard

A modern task management dashboard powered by Asana integration. Built with React/Vite frontend and Node.js/Express backend.

![Chimera Dashboard](./frontend/public/chimera.png)

## Features

- 🎯 **Real-time Asana Integration** - Connect directly to your Asana workspace
- 📊 **Task Management** - View, create, and complete tasks
- 🎨 **Modern UI** - Sleek glassmorphic design with cyberpunk aesthetics
- ⚡ **Fast & Responsive** - Built with Vite for lightning-fast development
- 🔒 **Secure** - API token stored securely, never exposed to frontend
- 📱 **Mobile Friendly** - Responsive design works on all devices

## Architecture

```
chimera-dashboard/
├── frontend/              # React/Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Node.js/Express API
│   ├── server.js         # Main server file
│   ├── Dockerfile        # Docker configuration
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Asana account with Personal Access Token
- Google Cloud account (for Cloud Run deployment)
- Cloudflare account (for Pages deployment)

## Local Development

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional - can configure via Settings page):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Getting Your Asana Personal Access Token

1. Go to [Asana Developer Console](https://app.asana.com/0/my-apps)
2. Click "Create new token"
3. Give it a descriptive name (e.g., "Chimera Dashboard")
4. Copy the token and save it securely
5. Enter the token in the Chimera Settings page

## Deployment

### Backend Deployment (Google Cloud Run)

1. **Build the Docker image:**
```bash
cd backend
docker build -t chimera-backend .
```

2. **Tag for Google Container Registry:**
```bash
docker tag chimera-backend gcr.io/YOUR_PROJECT_ID/chimera-backend
```

3. **Push to GCR:**
```bash
docker push gcr.io/YOUR_PROJECT_ID/chimera-backend
```

4. **Deploy to Cloud Run:**
```bash
gcloud run deploy chimera-backend \
  --image gcr.io/YOUR_PROJECT_ID/chimera-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi
```

5. **Note the service URL** (e.g., `https://chimera-backend-xxxxx-uc.a.run.app`)

### Frontend Deployment (Cloudflare Pages)

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Update API endpoint:**

Before building, update the `vite.config.js` to point to your Cloud Run backend:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://chimera-backend-xxxxx-uc.a.run.app',
        changeOrigin: true
      }
    }
  }
})
```

Or create a `frontend/.env.production`:
```
VITE_API_URL=https://chimera-backend-xxxxx-uc.a.run.app
```

And update your API calls to use `import.meta.env.VITE_API_URL + '/api/...'`

3. **Deploy to Cloudflare Pages:**

**Option A: Via Cloudflare Dashboard**
- Go to Cloudflare Pages dashboard
- Click "Create a project"
- Connect your Git repository
- Set build command: `npm run build`
- Set build output directory: `dist`
- Deploy!

**Option B: Via Wrangler CLI**
```bash
npm install -g wrangler
wrangler pages project create chimera-dashboard
wrangler pages deploy dist
```

4. **Configure Custom Domain** (optional):
- In Cloudflare Pages, go to Custom Domains
- Add your domain (e.g., `chimera.yourdomain.com`)

## Configuration

### First Time Setup

1. Navigate to the deployed frontend URL
2. Click "Configure Settings"
3. Enter your Asana Personal Access Token
4. Click "Test Connection" to verify
5. Select your Workspace
6. (Optional) Select a default Project
7. Click "Save Settings"

### Environment Variables

The backend accepts these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 8080) |
| `ASANA_TOKEN` | Asana Personal Access Token | No (can set via UI) |
| `ASANA_WORKSPACE` | Default workspace ID | No (can set via UI) |
| `ASANA_PROJECT` | Default project ID | No (can set via UI) |

## API Endpoints

### Settings
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Save settings

### Asana Integration
- `POST /api/asana/test` - Test Asana connection
- `GET /api/asana/workspaces` - List workspaces
- `GET /api/asana/projects` - List projects in workspace

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/stats` - Get task statistics
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:taskId` - Update task
- `PUT /api/tasks/:taskId/complete` - Mark task as complete
- `DELETE /api/tasks/:taskId` - Delete task

### Projects
- `GET /api/projects` - Get all projects

### Health
- `GET /api/health` - Health check endpoint

## Security Considerations

1. **API Token Storage**: Tokens are stored in-memory on the backend and never sent to the frontend
2. **HTTPS**: Always use HTTPS in production (enforced by Cloud Run and Cloudflare)
3. **CORS**: Configure CORS appropriately for your domains
4. **Rate Limiting**: Consider adding rate limiting for production use
5. **Service Account**: Consider using a dedicated Asana service account rather than personal tokens

## Troubleshooting

### Backend Issues

**Connection refused:**
- Verify the backend is running: `curl http://localhost:8080/api/health`
- Check Cloud Run logs: `gcloud run services logs read chimera-backend`

**Asana API errors:**
- Verify your token is valid
- Check token has correct permissions
- Ensure workspace and project IDs are correct

### Frontend Issues

**API calls failing:**
- Check that the API URL is correct in the proxy configuration
- Verify CORS is configured on the backend
- Check browser console for errors

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **date-fns** - Date formatting

### Backend
- **Node.js 20** - Runtime
- **Express** - Web framework
- **Asana SDK** - Official Asana client library
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Infrastructure
- **Google Cloud Run** - Backend hosting
- **Cloudflare Pages** - Frontend hosting
- **Docker** - Backend containerization

## Future Enhancements

- [ ] Add task filtering and search
- [ ] Add task assignment to other users
- [ ] Add project-based views
- [ ] Add task comments
- [ ] Add file attachments
- [ ] Add custom fields support
- [ ] Add webhooks for real-time updates
- [ ] Add task templates
- [ ] Add bulk operations
- [ ] Add analytics and reporting
- [ ] Add team collaboration features
- [ ] Add mobile app (React Native)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions:
- Check the [Asana API Documentation](https://developers.asana.com/docs)
- Review [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- Review [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)

## Credits

- Design inspired by AWM Process Hub
- Built with ❤️ for modern task management
- Powered by Asana

---

**Built for Ascot Wealth Management | Tumorra Project**
