# Multi-stage build: build frontend, then serve via nginx and reverse-proxy to backend

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
# Use npm ci if lockfile exists; otherwise fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci --quiet --no-progress; else npm install --quiet --no-progress; fi || npm install --quiet --no-progress
COPY frontend .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
