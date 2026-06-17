# Build stage
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]
