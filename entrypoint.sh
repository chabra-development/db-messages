#!/bin/sh
set -e

echo "Aplicando migrations do Prisma no banco de dados..."
bunx prisma migrate deploy --schema=./prisma/schema

echo "Iniciando aplicacao Next.js..."
exec bun server.js
