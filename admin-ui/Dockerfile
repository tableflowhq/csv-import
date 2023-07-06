FROM node:16-alpine AS frontend
WORKDIR /admin-ui

COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:stable-alpine AS final
COPY --from=frontend /admin-ui/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g \"daemon off;\""]
