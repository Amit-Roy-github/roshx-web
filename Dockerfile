# ─────────────────────────────────────────────────────────────
#  Stage 1 — build the Vite bundle with Node 25 (matches local).
# ─────────────────────────────────────────────────────────────
FROM node:25-alpine AS build
WORKDIR /app

# Deps first so `npm ci` stays cached across code-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────
#  Stage 2 — serve dist/ via nginx, proxying /api/* to
#  lal-ju-server. nginx listens on $PORT (Cloud Run sets 8080).
# ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
