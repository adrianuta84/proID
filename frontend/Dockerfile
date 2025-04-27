# proID/frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Command overridden by compose for dev
CMD ["npm", "run", "dev", "--", "--host"]