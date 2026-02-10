# =============================================================================
# Next.js Dockerfile for AWS Lambda with Lambda Web Adapter
# =============================================================================
# Architecture: Multi-stage build optimized for Lambda container deployment
#
# Stage 1 (deps):    Install dependencies
# Stage 2 (builder): Build Next.js application
# Stage 3 (runner):  Production runtime with Lambda Web Adapter
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production=false

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Lambda Web Adapter)
# -----------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Install Lambda Web Adapter from AWS ECR Public
# Note: If building locally, run 'docker logout public.ecr.aws' first to avoid auth issues
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

# Environment configuration
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built application (standalone output)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Lambda Web Adapter will invoke this server
ENTRYPOINT ["node", "server.js"]
