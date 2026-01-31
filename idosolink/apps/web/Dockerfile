FROM node:18-alpine

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/web3/package.json ./packages/web3/package.json
COPY packages/payments/package.json ./packages/payments/package.json

RUN npm install

COPY apps/web ./apps/web
COPY packages ./packages

WORKDIR /app/apps/web

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
