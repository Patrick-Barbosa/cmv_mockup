FROM nginx:1.27-alpine

COPY . /usr/share/nginx/html
COPY docker-entrypoint.d/40-write-config.sh /docker-entrypoint.d/40-write-config.sh

RUN chmod +x /docker-entrypoint.d/40-write-config.sh

EXPOSE 80
