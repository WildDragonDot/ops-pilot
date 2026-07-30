FROM node:18-alpine

WORKDIR /app

# Install all deps (including devDependencies for tsx/tsc build)
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5080

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
