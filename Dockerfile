# Use the official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's files
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the default port for Next.js
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "run", "start"]
