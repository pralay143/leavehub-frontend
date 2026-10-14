# LeaveHub frontend: built with Node, served by nginx as a non-root user.
#
# Build: docker build -t leavehub-frontend --build-arg VITE_API_BASE_URL=https://api.example.com .
# Run:   docker run -p 8080:8080 -e API_ORIGIN=https://api.example.com leavehub-frontend

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The API address is compiled into the app, so it must be given at build time.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build


FROM nginxinc/nginx-unprivileged:alpine

# Allowed in the Content-Security-Policy connect-src; leave empty when the API
# is served from the same origin (e.g. /api proxied to the backend).
ENV API_ORIGIN=""

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
