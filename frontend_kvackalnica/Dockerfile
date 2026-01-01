FROM node:20-alpine
WORKDIR /app

COPY package*.json package-lock.json* ./
# use npm install because package-lock.json may not exist; npm ci fails without lockfile
RUN npm install

# source will be mounted by docker-compose for hot-reload
ENV HOST=0.0.0.0
ENV PORT=5173
EXPOSE 5173

# ensure dev server binds to 0.0.0.0; extra args passed after --
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]