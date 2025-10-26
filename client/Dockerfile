FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Clean install dependencies (forces native modules to rebuild for this arch)
RUN npm ci --legacy-peer-deps

# Copy source code and config
COPY src ./src
COPY public ./public
# Include build configs used by Vite/Tailwind inside the container
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts ./
COPY tailwind.config.ts postcss.config.js ./

# Expose dev server port
EXPOSE 5173

# Start dev server with HMR enabled for Docker
CMD ["npm", "run", "dev"]
