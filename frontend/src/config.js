// API configuration
// Use Cloud Run backend in production, empty string for local dev (proxy handles it)
export const API_BASE = window.location.hostname === 'localhost'
  ? ''
  : 'https://asana-1023240361435.europe-west1.run.app'
