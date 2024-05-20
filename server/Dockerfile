FROM node
WORKDIR /app
COPY . .

RUN npm i --omit dev

EXPOSE 8082

CMD ["node", "app.js"]