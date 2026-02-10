#!/bin/bash

# Build script for the Quantum Blockchain Interactive application

set -e

echo "🔧 Building Quantum Blockchain Interactive Docker image..."

# Navigate to the project root directory (parent of app directory)
cd "$(dirname "$0")/.."

# Build Docker image from project root with app/Dockerfile
docker build -f app/Dockerfile -t qc-bc-interactive:latest .

echo "✅ Docker image built successfully!"
echo "📦 Image: qc-bc-interactive:latest"

# Optional: Tag for local testing
docker tag qc-bc-interactive:latest qc-bc-interactive:dev

echo "🏷️  Tagged as qc-bc-interactive:dev for local development"
echo "🚀 Ready for deployment!"
