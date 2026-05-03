ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM ${NODE_IMAGE}

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3007

ENV HOST=0.0.0.0
ENV PORT=3007
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
