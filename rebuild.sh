#!/bin/bash

echo "================================================"
echo "Rebuilding and Relinking Esnaad Code"
echo "================================================"
echo ""

# Clean old build
echo "1. Cleaning old build..."
rm -rf dist/
echo "   ✓ Cleaned"
echo ""

# Reinstall dependencies (in case package.json changed)
echo "2. Installing dependencies..."
npm install
echo "   ✓ Dependencies installed"
echo ""

# Build
echo "3. Building TypeScript..."
npm run build
echo "   ✓ Build complete"
echo ""

# Unlink old version
echo "4. Unlinking old global version..."
npm unlink -g esnaad 2>/dev/null || true
echo "   ✓ Unlinked"
echo ""

# Link new version
echo "5. Linking new version globally..."
npm link
echo "   ✓ Linked"
echo ""

# Verify
echo "6. Verifying installation..."
which esnaad
echo ""

echo "================================================"
echo "✅ Rebuild Complete!"
echo "================================================"
echo ""
echo "To test the loop:"
echo "  esnaad"
echo ""
echo "Then try multiple messages:"
echo "  esnaad> hi"
echo "  esnaad> how are you"
echo "  esnaad> /exit"
echo ""
