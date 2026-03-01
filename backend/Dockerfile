FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
