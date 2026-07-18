FROM nginxinc/nginx-unprivileged:1.31.3-alpine3.24

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 8080
