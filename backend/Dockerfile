FROM node:24.18.1-alpine AS build

ENV TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache tzdata

RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .

RUN npm run build

FROM node:24.18.1-alpine AS production

ENV NODE_ENV=production
ENV TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN apk add --no-cache tzdata

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["npm", "run", "start:prod"]
