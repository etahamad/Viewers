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

## Build

```bash
docker compose build ohif_viewer
```

```bash
docker tag webapp:latest <docker-hub-username>/ohif-viewer:v3.x.x
```

```bash

docker push <docker-hub-username>/ohif-viewer:v3.x.x
```

## Run

You can run it like normal ohif image
