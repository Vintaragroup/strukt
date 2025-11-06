import type { Node, Edge } from "@xyflow/react";
import type { CustomNodeData } from "@/components/CustomNode";
import type { CenterNodeData } from "@/components/CenterNode";
import type { EditableCardData, CardSection, TodoItem } from "@/components/EditableCard";

type AnyNodeData = CustomNodeData | CenterNodeData | Record<string, unknown>;

export interface DocumentationCard {
  id: string;
  title: string;
  type: EditableCardData["type"];
  sections?: CardSection[];
  todos?: TodoItem[];
  content?: string;
  metadata?: EditableCardData["metadata"];
}

export interface DocumentationNode {
  id: string;
  label: string;
  type: string;
  domain?: string;
  summary?: string;
  tags: string[];
  accuracy?: EditableCardData["metadata"]["accuracy"];
  cards: DocumentationCard[];
  outgoing: string[];
  incoming: string[];
}

export interface DocumentationBundle {
  workspace: {
    name: string;
    summary?: string;
    nodeCount: number;
    edgeCount: number;
    generatedAt: string;
  };
  nodes: DocumentationNode[];
  relationships: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  markdown: string;
}

export type DocumentationFlagKind = "node" | "card" | "section" | "todo";

export interface DocumentationFlag {
  id: string;
  kind: DocumentationFlagKind;
  nodeId: string;
  cardId?: string;
  sectionId?: string;
  todoId?: string;
  label: string;
  note?: string;
}

export const documentationFlagId = (...parts: Array<string | undefined>): string => {
  return parts.filter(Boolean).join("::");
};

function toArray<T>(value: unknown, predicate: (entry: unknown) => entry is T): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(predicate);
}

const sanitizeCard = (raw: EditableCardData): DocumentationCard => {
  const sections = toArray<CardSection>(raw.sections, (entry): entry is CardSection => {
    return Boolean(
      entry &&
        typeof entry === "object" &&
        typeof entry.title === "string" &&
        typeof entry.body === "string"
    );
  });

  const todos = toArray<TodoItem>(raw.todos, (entry): entry is TodoItem => {
    return Boolean(
      entry &&
        typeof entry === "object" &&
        typeof entry.text === "string" &&
        typeof entry.completed === "boolean"
    );
  });

  const normalizedSections = sections.map((section, index) => ({
    ...section,
    id:
      typeof section.id === "string" && section.id.trim().length > 0
        ? section.id
        : `${raw.id}-section-${index}`,
  }));

  const normalizedTodos = todos.map((todo, index) => ({
    ...todo,
    id:
      typeof todo.id === "string" && todo.id.trim().length > 0
        ? todo.id
        : `${raw.id}-todo-${index}`,
  }));

  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    sections: normalizedSections.length ? normalizedSections : undefined,
    todos: normalizedTodos.length ? normalizedTodos : undefined,
    content: typeof raw.content === "string" ? raw.content : undefined,
    metadata: raw.metadata,
  };
};

const isCustomNode = (node: Node<AnyNodeData>): node is Node<CustomNodeData> => {
  return node.type === "custom";
};

const toDocumentationNodes = (
  nodes: Node<AnyNodeData>[],
  edges: Edge[],
  centerId: string | null
): DocumentationNode[] => {
  const inboundMap = new Map<string, string[]>();
  const outboundMap = new Map<string, string[]>();

  for (const edge of edges) {
    if (!edge.source || !edge.target) continue;
    if (!outboundMap.has(edge.source)) outboundMap.set(edge.source, []);
    outboundMap.get(edge.source)!.push(edge.target);

    if (!inboundMap.has(edge.target)) inboundMap.set(edge.target, []);
    inboundMap.get(edge.target)!.push(edge.source);
  }

  return nodes
    .filter((node) => isCustomNode(node))
    .map((node) => {
      const data = node.data || ({} as CustomNodeData);
      const cards = Array.isArray(data.cards)
        ? data.cards
            .filter((card): card is EditableCardData => Boolean(card && typeof card === "object"))
            .map(sanitizeCard)
        : [];

      return {
        id: node.id,
        label: data.label || node.id,
        type: data.type || "requirement",
        domain: data.domain,
        summary: data.summary,
        tags: Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === "string") : [],
        accuracy: data.cards?.[0]?.metadata?.accuracy, // representative accuracy (first card)
        cards,
        incoming: inboundMap.get(node.id) ?? [],
        outgoing: outboundMap.get(node.id) ?? [],
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

const toWorkspaceMarkdown = (
  workspaceName: string,
  summary: string | undefined,
  nodes: DocumentationNode[]
): string => {
  const lines: string[] = [];
  lines.push(`# ${workspaceName}`);
  if (summary) {
    lines.push("", summary);
  }
  lines.push("", `Generated at: ${new Date().toISOString()}`, "");

  for (const node of nodes) {
    lines.push(`## ${node.label}`, `*Type:* ${node.type}`);
    if (node.domain) {
      lines.push(`*Domain:* ${node.domain}`);
    }
    if (node.tags.length) {
      lines.push(`*Tags:* ${node.tags.join(", ")}`);
    }
    if (node.summary) {
      lines.push("", node.summary);
    }

    for (const card of node.cards) {
      lines.push("", `### ${card.title} (${card.type})`);
      if (card.metadata?.accuracy) {
        lines.push(
          `*Accuracy:* ${card.metadata.accuracy.score}% (${card.metadata.accuracy.status})`
        );
      }
      if (card.content) {
        lines.push("", card.content);
      }
      if (card.sections) {
        for (const section of card.sections) {
          lines.push("", `#### ${section.title}`, section.body || "_No content_");
        }
      }
      if (card.todos && card.todos.length) {
        lines.push("", "#### Checklist");
        for (const todo of card.todos) {
          lines.push(`- [${todo.completed ? "x" : " "}] ${todo.text}`);
        }
      }
    }
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
};

export const buildDocumentationBundle = ({
  workspaceName,
  workspaceSummary,
  nodes,
  edges,
}: {
  workspaceName: string;
  workspaceSummary?: string;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
}): DocumentationBundle => {
  const centerNode = nodes.find((node) => node.type === "center");
  const docNodes = toDocumentationNodes(nodes, edges, centerNode?.id ?? null);

  const relationships = edges
    .filter((edge) => Boolean(edge.source && edge.target))
    .map((edge) => ({
      source: edge.source!,
      target: edge.target!,
      label: typeof (edge.data as any)?.label === "string" ? (edge.data as any).label : undefined,
    }));

  const markdown = toWorkspaceMarkdown(workspaceName, workspaceSummary, docNodes);

  return {
    workspace: {
      name: workspaceName,
      summary: workspaceSummary,
      nodeCount: docNodes.length,
      edgeCount: relationships.length,
      generatedAt: new Date().toISOString(),
    },
    nodes: docNodes,
    relationships,
    markdown,
  };
};
