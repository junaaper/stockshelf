#!/bin/bash
echo "=== StockShelf Trivy Security Scan ==="
echo "Scanning backend dependencies..."
trivy fs --severity HIGH,CRITICAL --format table ./backend

echo ""
echo "Scanning backend Docker image..."
trivy image --severity HIGH,CRITICAL junaaper/stockshelf-backend:latest

echo ""
echo "Scanning frontend Docker image..."
trivy image --severity HIGH,CRITICAL junaaper/stockshelf-frontend:latest
