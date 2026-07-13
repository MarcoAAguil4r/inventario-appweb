FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:4000/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["npm", "start"]
