FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATA_DIR=/app/data
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
RUN chown -R node:node /app
EXPOSE 8080
CMD ["sh", "-c", "mkdir -p /app/uploads/private/rg && chown -R node:node /app/uploads && exec su node -s /bin/sh -c 'npm run db:migrate && npm run db:seed && npm start'"]
