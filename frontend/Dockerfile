FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Set environment variables
ENV SKIP_PREFLIGHT_CHECK=true
ENV NODE_ENV=development
ENV PORT=3001

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"] 