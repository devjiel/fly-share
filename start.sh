#!/bin/bash

echo "🚀 Démarrage de Fly-Share avec Docker..."

# Arrêter les conteneurs existants si nécessaire
docker-compose down

# Construire et démarrer tous les services
echo "📦 Construction et démarrage des services..."
docker-compose up --build -d

echo "✅ Services démarrés!"
echo "📱 Frontend: http://localhost:3001"
echo "🔌 Backend API: http://localhost:4001"
echo ""
echo "Pour voir les logs: docker-compose logs --follow"
echo "Pour arrêter: docker-compose down" 