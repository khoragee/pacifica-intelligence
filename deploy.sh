#!/bin/bash
# Pacifica Intelligence Dashboard — One-shot Vercel deploy
# Run this once on your machine: bash deploy.sh

set -e
echo ""
echo "🚀  Pacifica Intelligence — Vercel Deploy"
echo "==========================================="

# Check vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

echo ""
echo "Deploying to Vercel (production)..."
echo "If prompted: select your team → create new project named 'pacifica-intelligence'"
echo ""

vercel deploy --prod \
  --yes \
  --name pacifica-intelligence \
  --build-env USE_TESTNET=false 2>&1

echo ""
echo "✅  Done! Your dashboard is live."
