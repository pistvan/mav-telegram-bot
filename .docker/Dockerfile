################################
# Base images
################################
FROM node:22-alpine3.20 AS base

RUN mkdir -p /app /storage && chown -R node:node /app /storage
USER node
WORKDIR /app

################################
# Build phase
################################
FROM base AS build

COPY package.json package-lock.json .
RUN npm ci

COPY . .
RUN npx tsc

################################
# Production phase
################################
FROM base AS production

# This will enforce node to install only production dependencies.
ENV NODE_ENV=production

COPY --from=build /app/dist/ .
COPY --from=build /app/package.json /app/package-lock.json .
RUN npm ci && \
    # Initialize the volume
    npx typeorm schema:sync -d data-source.js

VOLUME /storage

CMD ["node", "index.js"]
