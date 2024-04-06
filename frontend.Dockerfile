# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.10.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js/Prisma"

# Node.js/Prisma app lives here
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_IMAGEKIT_URL_ENDPOINT
ENV VITE_IMAGEKIT_URL_ENDPOINT=$VITE_IMAGEKIT_URL_ENDPOINT

ARG VITE_IMAGEKIT_PUBLIC_KEY
ENV VITE_IMAGEKIT_PUBLIC_KEY=$VITE_IMAGEKIT_PUBLIC_KEY

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=8.15.2
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# Install node modules
COPY --link .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Generate Prisma Client
COPY --link prisma .
RUN npx prisma generate

# Copy application code
COPY --link . .

# Build application
RUN pnpm nx run-many -t build

# Remove development dependencies
RUN pnpm prune --prod


# Final stage for app image
FROM nginx:1.25.4

# Install packages needed for deployment
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y openssl && \
  rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app/dist/apps/frontend /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

