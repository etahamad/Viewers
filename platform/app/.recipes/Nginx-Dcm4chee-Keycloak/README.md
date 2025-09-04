# OHIF Viewer Build & Run Instructions

## Prerequisites

- Docker
- Docker Compose
- Git

## Clone the Repository

```bash
git clone https://github.com/etahamad/Viewers
cd Viewers/platform/app/.recipes/Nginx-Dcm4chee-Keycloak
```

## Build the Viewer Image

```bash
docker compose build ohif_viewer
```

## (Optional) Tag and Push to Docker Hub

```bash
docker tag webapp:latest <docker-hub-username>/ohif-viewer:v3.x.x
docker push <docker-hub-username>/ohif-viewer:v3.x.x
```

## Run the Viewer

**Note:**
Mount your custom `app-config.js` from your server and set the `APP_CONFIG` environment variable to its path inside the container.
Do not change other configuration paths.

Example service definition for Docker Compose or Traefik:

```yaml
ohif-viewer:
  image: etahamad/ohif-viewer:v3.12.0-beta
  restart: unless-stopped
  ports:
    - 3000:80
  environment:
    - APP_CONFIG=/usr/share/nginx/html/app-config-temp.js
  volumes:
    - /etc/docker/viewerdicom/app-config.js:/usr/share/nginx/html/app-config-temp.js
  networks:
    - traefik_network
  labels:
    - traefik.enable=true
    - traefik.http.routers.ohif_app.rule=Host(`URL HERE`)
    - traefik.http.routers.ohif_app.entrypoints=websecure
    - traefik.http.routers.ohif_app.tls.certresolver=letsencryptresolver
    - traefik.http.routers.ohif_app.service=ohif_app
    - traefik.http.services.ohif_app.loadbalancer.server.port=80
    - traefik.http.services.ohif_app.loadbalancer.passhostheader=true
    - traefik.http.middlewares.sslheader.headers.customrequestheaders.X-Forwarded-Proto=https
    - traefik.http.routers.ohif_app.middlewares=sslheader@docker
```

## Notes

- The `APP_CONFIG` environment variable must match the path inside the container where your config is mounted.
- For production, configure Traefik and SSL as needed.
- For troubleshooting, ensure file permissions are correct and the config file is readable by
