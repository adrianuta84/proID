# proID/backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Make port 5000 available to the world outside this container (defined in compose)
EXPOSE 5000
# Define the command to run your app using CMD which defines your runtime
# Use npm run dev for development (via docker-compose command override)
# Use npm start for production build
CMD [ "npm", "start" ]