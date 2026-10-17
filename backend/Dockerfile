# ---------- Build stage ----------
FROM node:20-slim AS build
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma folder and generate the Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production

# Production dependencies only (prisma CLI is a regular dependency)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Regenerate the Prisma Client inside the runtime image
COPY prisma ./prisma
RUN npx prisma generate

# Compiled JavaScript from the build stage
COPY --from=build /app/dist ./dist

# Folders used by multer at runtime
RUN mkdir -p uploads tmp

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

# Diagnose env, apply migrations (with timeout), then start the server
CMD ["sh", "docker-entrypoint.sh"]
