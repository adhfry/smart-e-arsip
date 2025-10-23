# Multi-stage build untuk optimasi size dan performa

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .
RUN npx prisma generate && \
    npm run build && \
    npm prune --production

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy necessary files from builder
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package*.json ./

# Create directories for uploads and logs
RUN mkdir -p uploads logs && \
    chown -R nestjs:nodejs uploads logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE ${APP_PORT:-3005}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.APP_PORT || 3005; require('http').get('http://localhost:' + port + '/api', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Use dumb-init to run application
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
