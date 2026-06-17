# Build stage
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
COPY ecosystem.config.cjs ./
RUN npm install -g pm2
EXPOSE 8080
CMD ["pm2-runtime", "ecosystem.config.cjs"]
