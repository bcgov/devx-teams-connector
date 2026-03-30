FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk update && apk upgrade --no-cache
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf package-lock.json /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV NODE_ENV=production
EXPOSE 3000

RUN adduser -D -u 1001 appuser
USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=5 CMD wget -qO- http://localhost:3000/api/v1/ready || exit 1

CMD ["node", "dist/index.js"]
