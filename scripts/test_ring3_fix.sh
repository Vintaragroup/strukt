#!/bin/bash

API_BASE="http://localhost:5050/api"

echo "=== Testing Ring 3 Node Creation Fix ==="
echo ""

# Step 1: Create a fresh workspace with center node only
echo "1. Creating workspace with center node..."
WORKSPACE_ID=$(curl -s -X POST "$API_BASE/workspaces" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Ring3 Fix",
    "nodes": [
      {
        "id": "center",
        "type": "root",
        "data": {
          "label": "System",
          "ring": 0,
          "nodeType": "center"
        },
        "position": { "x": 0, "y": 0 }
      }
    ],
    "edges": []
  }' | jq -r '._id')

echo "Workspace created with ID: $WORKSPACE_ID"
echo ""

# Step 2: Get the workspace to verify current state
echo "2. Current workspace state:"
curl -s "$API_BASE/workspaces/$WORKSPACE_ID" | jq '{nodeCount: (.nodes | length), nodes: (.nodes | map({id, label: .data.label, ring: .data.ring}))}'
echo ""

# Step 3: Fetch and display the test
echo "3. Testing complete. Workspace ready for manual testing at browser."
echo "   - Open browser console"
echo "   - Try adding a Ring 3 Backend Server node"
echo "   - Check for error: '[handleAddNode] Ring 3 node has no classification parent'"
echo "   - Error should NOT appear with the fix in place"
