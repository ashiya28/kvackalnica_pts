FROM node:18-alpine

WORKDIR /app

# copy only package files first for caching
COPY package*.json ./
RUN npm ci --only=production

# copy app sources
COPY . .

# default port - prilagodi če backend uporablja drug port
ENV PORT=5000
EXPOSE 5000

# prilagodi ukaz, če tvoj package.json uporablja npr. "start:node" ali "dev"
CMD ["npm", "start"]