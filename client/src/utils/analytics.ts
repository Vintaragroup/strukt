import { Node } from "reactflow";

export interface AnalyticsData {
  totalNodes: number;
  nodesByType: { type: string; count: number; percentage: number }[];
  completionStats: {
    totalTodos: number;
    completedTodos: number;
    completionRate: number;
  };
  nodesByStatus: { status: string; count: number }[];
  tagDistribution: { tag: string; count: number }[];
  timelineData: { date: string; nodesCreated: number }[];
  connectivityStats: {
    totalConnections: number;
    averageConnectionsPerNode: number;
    mostConnectedNode: string | null;
  };
}

export function calculateAnalytics(
  nodes: Node[],
  edges: any[]
): AnalyticsData {
  // Total nodes (excluding center node)
  const regularNodes = nodes.filter((n) => n.type !== "center");
  const totalNodes = regularNodes.length;

  // Nodes by type
  const typeCount: Record<string, number> = {};
  regularNodes.forEach((node) => {
    const type = node.data?.type || "unknown";
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  const nodesByType = Object.entries(typeCount).map(([type, count]) => ({
    type: formatType(type),
    count,
    percentage: totalNodes > 0 ? (count / totalNodes) * 100 : 0,
  }));

  // Completion stats (from todos)
  let totalTodos = 0;
  let completedTodos = 0;

  regularNodes.forEach((node) => {
    if (node.data?.todos && Array.isArray(node.data.todos)) {
      totalTodos += node.data.todos.length;
      completedTodos += node.data.todos.filter(
        (todo: any) => todo.completed
      ).length;
    }
  });

  const completionRate =
    totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

  // Nodes by status (if available)
  const statusCount: Record<string, number> = {
    "Not Started": 0,
    "In Progress": 0,
    Completed: 0,
  };

  regularNodes.forEach((node) => {
    if (node.data?.todos && Array.isArray(node.data.todos)) {
      const todos = node.data.todos;
      if (todos.length === 0) {
        statusCount["Not Started"]++;
      } else if (todos.every((t: any) => t.completed)) {
        statusCount["Completed"]++;
      } else if (todos.some((t: any) => t.completed)) {
        statusCount["In Progress"]++;
      } else {
        statusCount["Not Started"]++;
      }
    } else {
      statusCount["Not Started"]++;
    }
  });

  const nodesByStatus = Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
  }));

  // Tag distribution
  const tagCount: Record<string, number> = {};
  regularNodes.forEach((node) => {
    if (node.data?.tags && Array.isArray(node.data.tags)) {
      node.data.tags.forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  const tagDistribution = Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 tags

  // Timeline data (mock - would need actual creation timestamps)
  const timelineData = generateTimelineData(regularNodes);

  // Connectivity stats
  const totalConnections = edges.length;
  const connectionCount: Record<string, number> = {};

  edges.forEach((edge) => {
    connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
    connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
  });

  const mostConnectedNodeId =
    Object.keys(connectionCount).length > 0
      ? Object.entries(connectionCount).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0]
      : null;

  const mostConnectedNode = mostConnectedNodeId
    ? nodes.find((n) => n.id === mostConnectedNodeId)?.data?.label ||
      "Unknown"
    : null;

  const averageConnectionsPerNode =
    totalNodes > 0 ? totalConnections / totalNodes : 0;

  return {
    totalNodes,
    nodesByType,
    completionStats: {
      totalTodos,
      completedTodos,
      completionRate,
    },
    nodesByStatus,
    tagDistribution,
    timelineData,
    connectivityStats: {
      totalConnections,
      averageConnectionsPerNode,
      mostConnectedNode,
    },
  };
}

function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    requirement: "Requirement",
    doc: "Documentation",
    unknown: "Other",
  };
  return typeMap[type] || type;
}

function generateTimelineData(
  nodes: Node[]
): { date: string; nodesCreated: number }[] {
  // Mock timeline data - in a real app, you'd track actual creation dates
  // For now, we'll distribute nodes across the last 7 days
  const today = new Date();
  const timeline: { date: string; nodesCreated: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Simulate distribution (in reality, you'd count actual creation dates)
    const nodesCreated = i === 6 ? nodes.length : Math.floor(Math.random() * 5);

    timeline.push({
      date: dateStr,
      nodesCreated,
    });
  }

  return timeline;
}

export function getInsights(analytics: AnalyticsData): string[] {
  const insights: string[] = [];

  // Completion insights
  if (analytics.completionStats.completionRate === 100) {
    insights.push("🎉 All tasks completed! Great work!");
  } else if (analytics.completionStats.completionRate >= 75) {
    insights.push("👏 You're making excellent progress!");
  } else if (analytics.completionStats.completionRate >= 50) {
    insights.push("📈 You're halfway there!");
  } else if (analytics.completionStats.totalTodos > 0) {
    insights.push("💪 Keep going - you've got this!");
  }

  // Node distribution insights
  if (analytics.nodesByType.length > 0) {
    const dominantType = analytics.nodesByType.reduce((a, b) =>
      a.percentage > b.percentage ? a : b
    );
    if (dominantType.percentage > 50) {
      insights.push(
        `Most of your work focuses on ${dominantType.type.toLowerCase()}`
      );
    }
  }

  // Connectivity insights
  if (analytics.connectivityStats.totalConnections === 0) {
    insights.push("💡 Try connecting related nodes to visualize dependencies");
  } else if (
    analytics.connectivityStats.averageConnectionsPerNode < 1 &&
    analytics.totalNodes > 3
  ) {
    insights.push("🔗 Consider adding more connections between nodes");
  }

  // Tag insights
  if (analytics.tagDistribution.length === 0) {
    insights.push("🏷️ Add tags to organize and filter your nodes");
  } else if (analytics.tagDistribution.length > 5) {
    insights.push(`You're using ${analytics.tagDistribution.length} unique tags`);
  }

  // Size insights
  if (analytics.totalNodes === 0) {
    insights.push("Start by adding your first node!");
  } else if (analytics.totalNodes < 5) {
    insights.push("Your project is just getting started");
  } else if (analytics.totalNodes >= 20) {
    insights.push("You have a comprehensive project plan!");
  }

  return insights;
}
