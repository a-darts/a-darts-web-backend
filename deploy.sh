#!/bin/bash

echo "Iniciando despliegue del BACKEND de A-Darts..."

# 1. Traer cambios de GitHub
echo "1. Descargando los últimos cambios de GitHub..."
git pull
if [ $? -ne 0 ]; then
    echo "Error: No se pudieron descargar los cambios de GitHub."
    exit 1
fi

# 2. Instalar nuevas dependencias
echo "2. Instalando las dependencias de Node.js..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: Falló la instalación de las dependencias."
    exit 1
fi

# 3. Aplicar migraciones de la Base de Datos (Prisma)
echo "3. Aplicando migraciones en la base de datos de producción..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo "Error: Las migraciones de Prisma fallaron. Revisa las credenciales."
    exit 1
fi

# 4. Generar el cliente de Prisma (Por si cambió el schema.prisma)
echo "4. Regenerando el cliente de Prisma..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "Error: No se pudo generar el cliente de Prisma."
    exit 1
fi

# 5. Compilar el código TypeScript a JavaScript nativo
echo "5. Compilando el código de TypeScript (Build)..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: La compilación de TypeScript falló."
    exit 1
fi

# 6. Reiniciar el proceso vivo en PM2
echo "6. Reiniciando el proceso en PM2 para aplicar los cambios..."
pm2 restart a-darts-web-backend
if [ $? -ne 0 ]; then
    echo "Error: PM2 no pudo reiniciar el backend."
    exit 1
fi

echo "Éxito: Backend actualizado, base de datos migrada y proceso reiniciado correctamente."
