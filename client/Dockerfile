FROM node:24

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Clean install dependencies (forces native modules to rebuild for this arch)
RUN npm ci --verbose

# Copy source code and config
COPY src ./src
COPY public ./public
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts ./

# Expose dev server port
EXPOSE 5173

# Start dev server with HMR enabled for Docker
CMD ["npm", "run", "dev"]
