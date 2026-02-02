# Use official Node.js runtime
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
