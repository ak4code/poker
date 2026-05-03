# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the project files
COPY . .

# Build the Nuxt application
RUN npm run build

# Run stage
FROM node:20-alpine

WORKDIR /app

# Copy the built output from the builder stage
COPY --from=builder /app/.output ./.output

# Expose the port Nuxt listens on
EXPOSE 3000

# Set environment variables for Nitro/Nuxt
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Start the server
CMD ["node", ".output/server/index.mjs"]
