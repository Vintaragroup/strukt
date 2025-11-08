#!/bin/bash

# Project-specific MCP server startup
echo "🚀 Starting Frontend MCP Server for $(basename $(pwd))..."

# Ensure Docker network exists
docker network create frontend-mcp-network 2>/dev/null || true

# Stop any existing MCP server
docker stop frontend-mcp-server 2>/dev/null || true

# Start fresh MCP server
docker run -d \
    --name frontend-mcp-server \
    --rm \
    --network frontend-mcp-network \
    frontend-mcp-server \
    python -m src.frontend_mcp_server.main

if [ $? -eq 0 ]; then
    echo "✅ MCP Server started successfully!"
    echo "🔗 Available tools:"
    echo "   📱 React Component Generator"
    echo "   🎨 Tailwind CSS Suggester"
    echo "   📦 Package Analyzer" 
    echo "   🪝 React Hook Generator"
    echo "   🌊 React Flow Tools (6 tools)"
    echo "   📚 React Flow Learning Tools (6 tools)"
    echo ""
    echo "💡 GitHub Copilot now has enhanced frontend expertise!"
    echo "🔧 Ask Copilot Chat questions about React, Tailwind, or React Flow"
else
    echo "❌ Failed to start MCP server"
    echo "💡 Make sure the frontend-mcp-server Docker image exists"
    echo "🛠️ Build it with: docker build -t frontend-mcp-server /path/to/mcp/project"
fi
