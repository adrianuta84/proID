# Use Node.js Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build

# Rebuild bcrypt for Alpine
RUN npm rebuild bcrypt --build-from-source

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"] 