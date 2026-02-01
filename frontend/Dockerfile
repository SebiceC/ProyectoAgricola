# --- STAGE 1: Node (Base para Dev y Build) ---
FROM node:18-alpine as dev-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# En este punto tenemos Node y el código. Aquí se detendrá el Override.

# --- STAGE 2: Build (Solo para compilar) ---
FROM dev-stage as build-stage
RUN npm run build

# --- STAGE 3: Production (Nginx) ---
FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
