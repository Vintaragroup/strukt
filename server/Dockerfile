FROM node:24

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Expose port
EXPOSE 5050

# Start server in development mode with hot reload using tsx watch
CMD ["npm", "run", "dev"]
