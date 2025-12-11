# BUILD FRONTEND
FROM oven/bun:1 AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package.json client/bun.lockb* ./

# Install lient deps
RUN bun install --frozen-lockfile

# Copy client code
COPY client/ ./

# Build the app
RUN bun run build

# build backend
FROM oven/bun:1 AS backend-builder

WORKDIR /app/server

# Copy server package.json and bun.lock
COPY server/package.json server/bun.lockb* ./

# Install server deps
RUN bun install --frozen-lockfile

# Copy server code
COPY server/ ./

# Prod img
FROM oven/bun:1-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fontconfig \
    fonts-liberation \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files from builder
COPY --from=backend-builder /app/server /app/server

# Copy frontend build from builder
COPY --from=frontend-builder /app/client/dist /app/server/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Create uploads directory
RUN mkdir -p /app/server/uploads

WORKDIR /app/server


# Start the application
CMD ["bun", "run", "index.ts"]