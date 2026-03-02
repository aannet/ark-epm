FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

ENV DATABASE_URL=postgresql://arkepm:arkepm@postgres:5432/arkepm
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
