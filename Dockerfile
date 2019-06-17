# Install dependencies with npm and compile typescript code
FROM node:10.12.0-alpine AS dependencies
WORKDIR /opt/app
RUN npm install -g npm@6.4.1
COPY package.json package-lock.json ./
RUN npm ci
COPY bot.ts tsconfig.json ./
RUN npm run build
RUN npm prune --production && npm cache clean --force

# Build release image without npm
FROM node:10.12.0-alpine AS release
WORKDIR /opt/app
COPY --from=dependencies /opt/app/node_modules /opt/app/node_modules/
COPY --from=dependencies /opt/app/dist/bot.js /opt/app/

CMD [ "node", "bot.js" ]
