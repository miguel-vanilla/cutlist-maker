# Use a lightweight Node.js image as the base image
FROM node:20-alpine AS builder

# Set the working directory inside the container
# Using the root directory as requested
WORKDIR /

# Copy package.json and package-lock.json first
# This ensures these files are present for npm ci and improves caching
COPY package.json package-lock.json* ./

# Explicitly remove node_modules directory to ensure a clean install (might be redundant after copying all)
# Keeping this step for extra caution, though npm ci is clean by design
RUN rm -rf node_modules

# Clean npm cache (Keeping this step as well, just in case)
RUN npm cache clean --force

# Install dependencies using npm ci for a clean and deterministic installation
# npm ci requires a package-lock.json or yarn.lock file
RUN npm ci

# Copy the rest of the application code after dependencies are installed
COPY . .

# Build the Vite project for production
# The output will be in the 'dist' directory by default
RUN npm run build

# --- Stage 2: Serve the built application ---
# Use a minimal image to serve the static files
FROM alpine AS runner

# Install serve globally to serve the static files
RUN apk --no-cache add nodejs npm && npm install -g serve

# Set the working directory
# Using the root directory as requested
WORKDIR /

# Copy the built application from the builder stage
# Assuming dist is in the root after build
COPY --from=builder /dist ./dist

# Expose the port the application will run on
# Serve defaults to 3000, but we'll use 5000 here. Adjust if needed.
EXPOSE 5000

# Command to run the application using serve
# --listen 5000 sets the port
# -s serves the static files from the specified directory
CMD ["serve", "-s", "dist", "--listen", "5000"]

# --- Potential Troubleshooting Steps if the error persists ---
# If you encounter errors like "package.json: not found" or issues with npm ci:
# 1. Verify package.json Location: Double-check that 'package.json' exists in the ROOT of your repository.
# 2. Check .dockerignore: Look for a '.dockerignore' file in the ROOT of your repository. Ensure 'package.json' is NOT listed in it.
# 3. Verify package-lock.json: Double-check that 'package-lock.json' exists in the root of your repository and is not corrupted.
# 4. Check VPS Resources: Ensure your Ubuntu VPS has sufficient CPU, memory, and disk space for the build process.
# 5. Check Network: Verify stable network connectivity from your VPS, as npm downloads packages during the build.
# 6. Clean Docker Build Cache: If possible via Easypanel or Docker CLI, try a full clean of the Docker build cache on your VPS.
# 7. Try a different Node.js version or base image: Sometimes specific versions of Node/npm have bugs.
