FROM node:18.17

WORKDIR /app

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE 3333

CMD ["yarn", "start:prod"]
