FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all application files
COPY . .

# Expose frontend (3000) and backend (4000) ports
EXPOSE 3000 4000
