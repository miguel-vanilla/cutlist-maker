FROM nginx:alpine

# Copy pre-built files directly
COPY ./dist /usr/share/nginx/html

# Nginx config for SPA
RUN echo 'server {\
    listen 80;\
    server_name _;\
    root /usr/share/nginx/html;\
    index index.html;\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]