#!/bin/bash

# Directorio base de recursos
RES_DIR="android/app/src/main/res"

# Crear directorios si no existen
mkdir -p "$RES_DIR/mipmap-mdpi"
mkdir -p "$RES_DIR/mipmap-hdpi"
mkdir -p "$RES_DIR/mipmap-xhdpi"
mkdir -p "$RES_DIR/mipmap-xxhdpi"
mkdir -p "$RES_DIR/mipmap-xxxhdpi"

echo "✅ Directorios creados"
echo "ℹ️  Para generar iconos PNG reales, usa una herramienta como:"
echo "   - https://romannurik.github.io/AndroidAssetStudio/"
echo "   - https://easyappicon.com/"
echo "   - O instala imagemagick y genera desde SVG"
echo ""
echo "📱 Por ahora, el ícono vectorial en drawable/ funcionará para Android 5.0+"
