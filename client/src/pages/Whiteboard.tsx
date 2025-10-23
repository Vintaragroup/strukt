import React, { useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import Toolbar from '../components/Toolbar'
import RootNode from '../components/NodeTypes/RootNode'
import FrontendNode from '../components/NodeTypes/FrontendNode'
import BackendNode from '../components/NodeTypes/BackendNode'
import RequirementNode from '../components/NodeTypes/RequirementNode'
import DocNode from '../components/NodeTypes/DocNode'
import './Whiteboard.css'

const nodeTypes = {
  root: RootNode,
  frontend: FrontendNode,
  backend: BackendNode,
  requirement: RequirementNode,
  doc: DocNode,
}

const Whiteboard: React.FC = () => {
  const store = useWorkspaceStore()
  const [nodes, setNodes, onNodesChange] = useNodesState(store.nodes as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(store.edges as Edge[])

  // Sync store with React Flow state
  useEffect(() => {
    setNodes(store.nodes as Node[])
    setEdges(store.edges as Edge[])
  }, [store.nodes, store.edges, setNodes, setEdges])

  // Handle new edge connection with cycle detection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge: Edge = {
          id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          animated: true,
        }
        store.addEdge(newEdge)
      }
    },
    [store],
  )

  // Handle node changes (move, select, etc.)
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      // Update store when nodes change
      const updatedNodes = changes.reduce((acc: Node[], change: any) => {
        if (change.type === 'position' && change.position) {
          return acc.map((n: Node) =>
            n.id === change.id ? { ...n, position: change.position } : n,
          )
        }
        return acc
      }, nodes)
      if (updatedNodes.length > 0) {
        store.setNodes(updatedNodes)
      }
    },
    [onNodesChange, nodes, store],
  )

  return (
    <div className="whiteboard-container">
      <Toolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default Whiteboard
