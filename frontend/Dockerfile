FROM node:16-alpine AS frontend
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:stable-alpine AS final
COPY --from=frontend /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN apk add --update nodejs npm
RUN npm install -g runtime-env-cra
WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD ["/bin/sh", "-c", "NODE_ENV=development runtime-env-cra && nginx -g \"daemon off;\""]
