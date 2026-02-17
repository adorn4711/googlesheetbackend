# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src

RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/build ./build

# Expose port for Cloud Run (uses PORT env)
ENV NODE_ENV=production

# Cloud Run sets PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["node", "build/server.js"]
