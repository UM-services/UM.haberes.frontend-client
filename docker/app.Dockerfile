# syntax=docker/dockerfile:1
#
# Imagen multinodo para los clientes Angular del monorepo de haberes.
#
#   docker build -f docker/app.Dockerfile --build-arg APP=novedades \
#     -t um-haberes-novedades-client .
#
# La compilación ocurre DENTRO del contenedor: la imagen es función exclusiva
# del código fuente, nunca del `dist/` que haya en el disco. El Dockerfile de
# runtime que hacía `COPY dist/apps/<app>/browser` dejaba servir el bundle
# anterior si el `nx build` no se había vuelto a ejecutar.
#
# Toda la config propia de cada app (nginx.conf, entrypoint.sh) sigue viviendo
# en `apps/<app>/`; este archivo sólo parametriza el nombre.

ARG NODE_VERSION=24
ARG APP

# ---------- Etapa de compilación ----------
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /app
ENV NX_DAEMON=false

# Los manifiestos van primero para que `npm ci` sólo se re-ejecute cuando cambia
# el lockfile. El cache mount conserva los tarballs de npm entre builds.
#
# `sharing=locked`: el compose compila varias apps en paralelo y todas escriben
# en el mismo cache; con escritores simultáneos npm puede dejar incompleta alguna
# dependencia opcional (`npm/cli#4828`) y el build muere al final con
# "Chunk optimization failed - Cannot find native binding". Serializar el acceso
# al cache y usar un id propio del repo evita esa carrera.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,id=haberes-frontend-npm,sharing=locked \
    npm ci --no-audit --no-fund

# Los binarios nativos (rolldown/oxc, vía dependencias opcionales) se cargan
# recién en "Chunk optimization". Verificarlos acá hace que el build falle en
# segundos y con un mensaje claro si `npm ci` no los instaló.
RUN node -e "require('rolldown'); require('oxc-parser')"

# El resto del workspace. Cualquier cambio en `apps/` o `libs/` invalida esta
# capa y, con ella, la compilación: esa es la garantía de frescura.
COPY . .

# `--skip-nx-cache` evita que un `.nx/cache` persistente devuelva un `dist`
# por contenido; dentro de Docker la capa ya se descarta sola si cambió algo.
ARG APP
RUN npx nx build "${APP}" --configuration=production --skip-nx-cache

# ---------- Etapa de ejecución ----------
FROM nginx:alpine

# Instalamos openssl y generamos un certificado auto-firmado al vuelo
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=AR/ST=Mendoza/L=Mendoza/O=UM/OU=Haberes/CN=haberes.local"

# Build compilado en la etapa anterior + configuración propia de la app
ARG APP
COPY --from=build /app/dist/apps/${APP}/browser /usr/share/nginx/html
COPY --from=build /app/apps/${APP}/nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos y damos permisos al script de inicializacion de entorno
COPY --from=build /app/apps/${APP}/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 443

# Configuramos el entrypoint para que ejecute su script antes de nginx
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
