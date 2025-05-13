FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY shared ./shared

COPY backend .

RUN chmod +x entrypoint.sh

EXPOSE 4001

CMD ["./entrypoint.sh"] 