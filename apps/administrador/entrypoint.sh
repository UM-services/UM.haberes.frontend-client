#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

# Delimitador '#' en sed: los valores de las variables NO deben contener '#'.
replace_placeholder() {
  placeholder="$1"
  value="$2"
  for file in "$ROOT_DIR"/*.js;
  do
    if [ -f "$file" ] && grep -q "$placeholder" "$file"; then
      echo "   ... $placeholder found in $file. Replacing with ${value}."
      sed -i "s#$placeholder#${value}#g" "$file"
    fi
  done
}

echo "--- App Entrypoint Script Start ---"
echo "Received BACKEND_URL: [${BACKEND_URL}]"
echo "Received ENV_NAME: [${ENV_NAME}]"
echo "Received APP_VERSION: [${APP_VERSION}]"
echo "-------------------------------------"

echo "Searching for files to process in $ROOT_DIR..."
if [ -z "$BACKEND_URL" ]; then
    echo "Warning: BACKEND_URL environment variable is not set."
else
    replace_placeholder "BACKEND_URL_PLACEHOLDER" "$BACKEND_URL"
fi

# Defaults evidencian mal setup: la UI los pinta en rojo "SIN DEFINIR".
replace_placeholder "ENV_NAME_PLACEHOLDER" "${ENV_NAME:-desconocido}"
replace_placeholder "APP_VERSION_PLACEHOLDER" "${APP_VERSION:-sin-version}"

echo "-----------------------------------"
echo "--- App Entrypoint Script End ---"
echo ""

echo "Starting Nginx..."
exec "$@"
