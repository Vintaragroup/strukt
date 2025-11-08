#!/bin/bash
echo "🛑 Stopping Frontend MCP Server..."
docker stop frontend-mcp-server 2>/dev/null || true
echo "✅ MCP Server stopped"
