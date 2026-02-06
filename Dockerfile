FROM oven/bun:1.2.15 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN bun run build

FROM oven/bun:1.2.15 AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 3000
CMD ["bun", "run", "--cwd", "apps/web", "start"]
