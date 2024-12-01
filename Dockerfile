
FROM node:20-alpine AS build

WORKDIR /app/

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build


#prod stage
FROM node:20-alpine

WORKDIR /app/

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY --from=build /app/dist ./dist

COPY --from=build /app/package.json ./

RUN npm install --only=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
