FROM oven/bun:1.3.14-alpine

WORKDIR /app

COPY --chown=bun:bun package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY --chown=bun:bun tsconfig.json ./
COPY --chown=bun:bun src ./src

ENV NODE_ENV=production
ENV PORT=3000
ENV BUN_INSTALL=/tmp/bun

EXPOSE 3000

USER bun

CMD ["bun", "run", "src/server.ts"]
