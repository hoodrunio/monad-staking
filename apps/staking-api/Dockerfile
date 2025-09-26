# syntax=docker/dockerfile:1.5

FROM oven/bun:1.2 AS builder
WORKDIR /app

COPY bunfig.toml package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/staking-api/package.json apps/staking-api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/monad-staking-sdk/package.json packages/monad-staking-sdk/package.json

RUN bun install

COPY . .

RUN bun run --cwd packages/config build \
  && bun run --cwd packages/monad-staking-sdk build \
  && bun run --cwd apps/staking-api build

FROM oven/bun:1.2 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY bunfig.toml package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/staking-api/dist ./apps/staking-api/dist
COPY --from=builder /app/apps/staking-api/package.json ./apps/staking-api/package.json

RUN bun install --production

EXPOSE 8787
ENTRYPOINT ["bun"]
CMD ["run", "apps/staking-api/dist/index.js"]

