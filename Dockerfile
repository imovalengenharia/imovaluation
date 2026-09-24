# A casca e os módulos numa imagem só. Usada pelo compose.yaml para rodar a
# plataforma inteira num computador com Docker, sem instalar Node nem Postgres.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY casca ./casca
COPY modulos ./modulos
USER node
EXPOSE 3000
CMD ["node", "casca/iniciar.js"]
