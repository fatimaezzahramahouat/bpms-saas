# ---------- Build stage ----------
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite env vars are baked into the bundle at build time
ARG VITE_API_URL=http://localhost:5000/api
ARG GEMINI_API_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

COPY . .
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
