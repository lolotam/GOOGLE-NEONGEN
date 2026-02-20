FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all application files
COPY . .

# Build the Vite frontend for production
RUN npm run build

# The Express server serves both the API and the built frontend
# Default to port 3000 for production (overridable via PORT env var)
ENV PORT=3000

EXPOSE 3000

# Start the Express backend which also serves the static frontend
CMD ["npx", "tsx", "server/index.ts"]
