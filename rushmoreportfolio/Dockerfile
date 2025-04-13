# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port and run the app
EXPOSE 3000
CMD ["npm", "run", "start"]
