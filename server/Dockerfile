FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g typescript
RUN npm i ts-node
RUN npm install

COPY . .

USER node

CMD ["npm", "run", "dev"]

EXPOSE 8000
