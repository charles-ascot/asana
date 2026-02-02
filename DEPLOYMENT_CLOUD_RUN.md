# Google Cloud Run Deployment Guide

## Prerequisites

1. Google Cloud account with billing enabled
2. Google Cloud CLI (`gcloud`) installed and configured
3. Docker installed locally

## Step-by-Step Deployment

### 1. Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Build and Push Docker Image

```bash
# Navigate to backend directory
cd backend

# Build the Docker image
docker build -t chimera-backend .

# Tag for Google Container Registry
docker tag chimera-backend gcr.io/$PROJECT_ID/chimera-backend:latest

# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Push to GCR
docker push gcr.io/$PROJECT_ID/chimera-backend:latest
```

### 3. Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy chimera-backend \
  --image gcr.io/$PROJECT_ID/chimera-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60s

# The command will output a service URL like:
# Service URL: https://chimera-backend-xxxxx-uc.a.run.app
```

### 4. Set Environment Variables (Optional)

If you want to pre-configure Asana credentials:

```bash
gcloud run services update chimera-backend \
  --region us-central1 \
  --set-env-vars="ASANA_TOKEN=your_token_here,ASANA_WORKSPACE=workspace_id"
```

### 5. Configure Custom Domain (Optional)

```bash
# Map a custom domain
gcloud run domain-mappings create \
  --service chimera-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

### 6. Set Up Cloud Run Service Account (Recommended)

For better security, create a dedicated service account:

```bash
# Create service account
gcloud iam service-accounts create chimera-backend \
  --display-name "Chimera Backend Service Account"

# Deploy with service account
gcloud run deploy chimera-backend \
  --image gcr.io/$PROJECT_ID/chimera-backend:latest \
  --platform managed \
  --region us-central1 \
  --service-account chimera-backend@$PROJECT_ID.iam.gserviceaccount.com
```

## Monitoring and Logs

### View Logs

```bash
# Stream logs in real-time
gcloud run services logs tail chimera-backend --region us-central1

# Read recent logs
gcloud run services logs read chimera-backend --region us-central1 --limit 50
```

### Check Service Status

```bash
# Describe the service
gcloud run services describe chimera-backend --region us-central1

# List all revisions
gcloud run revisions list --service chimera-backend --region us-central1
```

## Continuous Deployment with Cloud Build

Create `cloudbuild.yaml` in the backend directory:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/chimera-backend:$COMMIT_SHA', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/chimera-backend:$COMMIT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'chimera-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/chimera-backend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'

images:
  - 'gcr.io/$PROJECT_ID/chimera-backend:$COMMIT_SHA'
```

Then trigger builds from GitHub:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Cost Optimization

Cloud Run pricing is based on:
- Request count
- CPU time
- Memory usage
- Network egress

To optimize costs:

1. **Set minimum instances to 0** (already default)
2. **Use appropriate memory allocation** (512Mi is usually sufficient)
3. **Set request timeout** (60s default)
4. **Enable CPU allocation only during request processing**:

```bash
gcloud run services update chimera-backend \
  --region us-central1 \
  --cpu-throttling
```

## Scaling Configuration

```bash
# Set scaling limits
gcloud run services update chimera-backend \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80
```

## Security Best Practices

1. **Use Secret Manager for sensitive data**:

```bash
# Create secret
echo -n "your-asana-token" | gcloud secrets create asana-token --data-file=-

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding asana-token \
  --member "serviceAccount:chimera-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role "roles/secretmanager.secretAccessor"

# Deploy with secret
gcloud run deploy chimera-backend \
  --image gcr.io/$PROJECT_ID/chimera-backend:latest \
  --region us-central1 \
  --set-secrets="ASANA_TOKEN=asana-token:latest"
```

2. **Enable VPC connector** for private network access (if needed)

3. **Set up Cloud Armor** for DDoS protection

## Troubleshooting

### Container fails to start

Check logs:
```bash
gcloud run services logs read chimera-backend --region us-central1
```

Common issues:
- PORT environment variable not set (Cloud Run sets this automatically)
- Application crashes on startup
- Dependencies not installed in Docker image

### 502 Bad Gateway

- Container not listening on the correct port (must use PORT env var)
- Container crashes during request handling
- Request timeout exceeded

### Cold starts taking too long

- Reduce Docker image size
- Use minimum instances > 0
- Optimize application startup time

## Clean Up

To delete the service:

```bash
gcloud run services delete chimera-backend --region us-central1
```

To delete the container image:

```bash
gcloud container images delete gcr.io/$PROJECT_ID/chimera-backend
```
