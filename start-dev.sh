#!/bin/bash
# Script de inicio rápido para el servidor de desarrollo

cd "$(dirname "$0")"
echo "🚀 Iniciando Inventario SaaS..."
echo ""
echo "Verificando dependencias..."
npm list next > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo ""
echo "✅ Iniciando servidor de desarrollo..."
echo "📍 Abriendo http://localhost:3000"
echo ""

npm run dev
