# Install dependencies with npm
FROM node:10.12.0-alpine AS dependencies
WORKDIR /opt/app
RUN npm install -g npm@6.4.1
COPY package.json package-lock.json ./
RUN npm ci && npm prune --production && npm cache clean --force

# Build release image without npm
FROM node:10.12.0-alpine AS release
WORKDIR /opt/app
COPY --from=dependencies /opt/app/node_modules ./node_modules
COPY ./bot.js ./

CMD [ "node", "bot.js" ]
