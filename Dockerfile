# Stage 1: Build dependencies
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Stage 2: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy everything from build
COPY --from=build /app /app

# Expose port
EXPOSE 4000

# Start app
CMD ["pnpm", "start"]
