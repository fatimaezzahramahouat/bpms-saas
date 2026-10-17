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
ENV PORT=5000

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

EXPOSE 5000

# Start the server directly; migrations are applied manually (see README/ops notes)
CMD ["node", "dist/server.js"]
