FROM node:20-alpine

WORKDIR /app

# Copy everything at once
COPY . .

# Install dependencies and build
RUN npm install && npm run build

# Install a simple server to serve the static files
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["serve", "-s", "dist", "-l", "3000"]