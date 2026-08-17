# =============================================================================
# FiestaLoco oyun sunucusu (WebSocket + API)
# Railway, Fly.io, Render veya herhangi bir container platformunda calisir.
# Frontend bu imajda YOK — o Vercel'de ayri deploy edilir.
# =============================================================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY server.ts ./
COPY server ./server
COPY src ./src

RUN npm run build:server


FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Yalnizca calisma zamani bagimliliklari
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist-server ./dist-server

# root olmayan kullanici
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist-server/server.cjs"]
