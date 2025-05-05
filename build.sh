#!/bin/bash

# Build script for cutlist-maker

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Install dependencies (if needed)
echo "Installing dependencies..."
npm install

# Build the app
echo "Building app..."
npm run build

# Build the Docker image
echo "Building Docker image..."
docker build -t cutlist-maker .

echo "Done! You can now run the container with:"
echo "docker run -p 80:80 cutlist-maker"
echo "Or use docker-compose up -d"