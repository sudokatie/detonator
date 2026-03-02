# Detonator Multiplayer Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source
COPY *.ts ./
COPY handlers/ ./handlers/

# Build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install production dependencies only
RUN npm install --production

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["node", "dist/index.js"]
