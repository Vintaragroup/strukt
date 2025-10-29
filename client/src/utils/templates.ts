import { Node, Edge } from "@xyflow/react";
import { CustomNodeData } from "../components/CustomNode";
import { CenterNodeData } from "../components/CenterNode";

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "product" | "research" | "design" | "development" | "planning";
  thumbnail?: string;
  isBuiltIn: boolean;
  nodes: Node[];
  edges: Edge[];
  metadata: {
    createdAt: Date;
    author?: string;
    tags?: string[];
  };
}

// Built-in starter templates
export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from scratch with just a center node",
    category: "planning",
    isBuiltIn: true,
    nodes: [
      {
        id: "center",
        type: "center",
        position: { x: 500, y: 300 },
        style: { width: 320 },
        data: {
          label: "My Project",
          description: "Start building your project here",
          icon: "🚀",
          link: "",
          buttonText: "Get Started",
  } as any,
      },
    ],
    edges: [],
    metadata: {
      createdAt: new Date("2025-01-01"),
      author: "FlowForge",
      tags: ["blank", "starter"],
    },
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Plan a complete product launch with features, marketing, and timeline",
    category: "product",
    isBuiltIn: true,
    nodes: [
      {
        id: "center",
        type: "center",
        position: { x: 500, y: 300 },
        style: { width: 320 },
        data: {
          label: "Product Launch",
          description: "A comprehensive product launch planning template with features, marketing strategy, and go-to-market plan",
          icon: "🚀",
          link: "",
          buttonText: "Start Planning",
  } as any,
      },
      {
        id: "features",
        type: "custom",
        position: { x: 900, y: 150 },
        style: { width: 280 },
        data: {
          label: "Core Features",
          type: "requirement",
          summary: "Key features and functionality",
          tags: ["mvp", "features"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Define your MVP features here",
            },
          ],
        } as any,
      },
      {
        id: "marketing",
        type: "custom",
        position: { x: 900, y: 350 },
        style: { width: 280 },
        data: {
          label: "Marketing Strategy",
          type: "doc",
          summary: "Marketing and positioning",
          tags: ["marketing", "gtm"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Create landing page",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Plan social media campaign",
              checked: false,
            },
          ],
        } as any,
      },
      {
        id: "timeline",
        type: "custom",
        position: { x: 900, y: 550 },
        style: { width: 280 },
        data: {
          label: "Launch Timeline",
          type: "requirement",
          summary: "Key milestones and deadlines",
          tags: ["timeline", "milestones"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Beta launch - Week 1",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Public launch - Week 4",
              checked: false,
            },
          ],
        } as any,
      },
    ],
    edges: [
      { id: "e-center-features", source: "center", target: "features", type: "custom" },
      { id: "e-center-marketing", source: "center", target: "marketing", type: "custom" },
      { id: "e-center-timeline", source: "center", target: "timeline", type: "custom" },
    ],
    metadata: {
      createdAt: new Date("2025-01-01"),
      author: "FlowForge",
      tags: ["product", "launch", "marketing"],
    },
  },
  {
    id: "research-project",
    name: "Research Project",
    description: "Organize research with questions, findings, and documentation",
    category: "research",
    isBuiltIn: true,
    nodes: [
      {
        id: "center",
        type: "center",
        position: { x: 500, y: 300 },
        style: { width: 320 },
        data: {
          label: "Research Project",
          description: "Organize your research questions, methodology, findings, and documentation",
          icon: "🔬",
          link: "",
          buttonText: "Begin Research",
  } as any,
      },
      {
        id: "questions",
        type: "custom",
        position: { x: 100, y: 150 },
        style: { width: 280 },
        data: {
          label: "Research Questions",
          type: "requirement",
          summary: "Key questions to investigate",
          tags: ["questions", "hypothesis"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "What are the main questions driving this research?",
            },
          ],
        } as any,
      },
      {
        id: "methodology",
        type: "custom",
        position: { x: 100, y: 450 },
        style: { width: 280 },
        data: {
          label: "Methodology",
          type: "doc",
          summary: "Research approach and methods",
          tags: ["methodology", "process"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Describe your research methods and approach",
            },
          ],
        } as any,
      },
      {
        id: "findings",
        type: "custom",
        position: { x: 900, y: 150 },
        style: { width: 280 },
        data: {
          label: "Key Findings",
          type: "requirement",
          summary: "Results and insights",
          tags: ["findings", "results"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Document your key findings and insights",
            },
          ],
        } as any,
      },
      {
        id: "documentation",
        type: "custom",
        position: { x: 900, y: 450 },
        style: { width: 280 },
        data: {
          label: "Documentation",
          type: "doc",
          summary: "Papers and references",
          tags: ["docs", "references"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Write research paper",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Gather references",
              checked: false,
            },
          ],
        } as any,
      },
    ],
    edges: [
      { id: "e-center-questions", source: "center", target: "questions", type: "custom" },
      { id: "e-center-methodology", source: "center", target: "methodology", type: "custom" },
      { id: "e-center-findings", source: "center", target: "findings", type: "custom" },
      { id: "e-center-documentation", source: "center", target: "documentation", type: "custom" },
    ],
    metadata: {
      createdAt: new Date("2025-01-01"),
      author: "FlowForge",
      tags: ["research", "academic", "science"],
    },
  },
  {
    id: "fullstack-app",
    name: "Fullstack Application",
    description: "Plan a fullstack app with frontend, backend, database, and deployment",
    category: "development",
    isBuiltIn: true,
    nodes: [
      {
        id: "center",
        type: "center",
        position: { x: 500, y: 300 },
        style: { width: 320 },
        data: {
          label: "Fullstack App",
          description: "Build a complete fullstack application with frontend, backend, database, and deployment infrastructure",
          icon: "💻",
          link: "",
          buttonText: "Start Building",
  } as any,
      },
      {
        id: "frontend",
        type: "custom",
        position: { x: 900, y: 100 },
        style: { width: 280 },
        data: {
          label: "Frontend",
          type: "frontend",
          summary: "React + Tailwind UI",
          tags: ["react", "tailwind", "ui"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Set up component library",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Build authentication UI",
              checked: false,
            },
          ],
        } as any,
      },
      {
        id: "backend",
        type: "custom",
        position: { x: 900, y: 320 },
        style: { width: 280 },
        data: {
          label: "Backend API",
          type: "backend",
          summary: "REST API with Node.js",
          tags: ["api", "node", "express"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Design API endpoints",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Implement authentication",
              checked: false,
            },
          ],
        } as any,
      },
      {
        id: "database",
        type: "custom",
        position: { x: 900, y: 540 },
        style: { width: 280 },
        data: {
          label: "Database",
          type: "backend",
          summary: "PostgreSQL schema",
          tags: ["database", "postgres", "schema"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Design database schema and relationships",
            },
          ],
        } as any,
      },
      {
        id: "deployment",
        type: "custom",
        position: { x: 100, y: 300 },
        style: { width: 280 },
        data: {
          label: "Deployment",
          type: "doc",
          summary: "CI/CD and hosting",
          tags: ["devops", "cicd", "hosting"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Set up CI/CD pipeline",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Configure hosting",
              checked: false,
            },
          ],
        } as any,
      },
    ],
    edges: [
      { id: "e-center-frontend", source: "center", target: "frontend", type: "custom" },
      { id: "e-center-backend", source: "center", target: "backend", type: "custom" },
      { id: "e-center-database", source: "center", target: "database", type: "custom" },
      { id: "e-center-deployment", source: "center", target: "deployment", type: "custom" },
      { id: "e-frontend-backend", source: "frontend", target: "backend", type: "custom" },
      { id: "e-backend-database", source: "backend", target: "database", type: "custom" },
    ],
    metadata: {
      createdAt: new Date("2025-01-01"),
      author: "FlowForge",
      tags: ["development", "fullstack", "web"],
    },
  },
  {
    id: "design-system",
    name: "Design System",
    description: "Create a design system with components, tokens, and documentation",
    category: "design",
    isBuiltIn: true,
    nodes: [
      {
        id: "center",
        type: "center",
        position: { x: 500, y: 300 },
        style: { width: 320 },
        data: {
          label: "Design System",
          description: "Build a comprehensive design system with components, design tokens, patterns, and documentation",
          icon: "🎨",
          link: "",
          buttonText: "Start Designing",
  } as any,
      },
      {
        id: "tokens",
        type: "custom",
        position: { x: 900, y: 100 },
        style: { width: 280 },
        data: {
          label: "Design Tokens",
          type: "requirement",
          summary: "Colors, typography, spacing",
          tags: ["tokens", "foundation"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Define color palette, typography scale, and spacing system",
            },
          ],
        } as any,
      },
      {
        id: "components",
        type: "custom",
        position: { x: 900, y: 320 },
        style: { width: 280 },
        data: {
          label: "Components",
          type: "frontend",
          summary: "Reusable UI components",
          tags: ["components", "ui"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Button variants",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Form inputs",
              checked: false,
            },
            {
              id: "card-3",
              type: "todo",
              content: "Cards and layouts",
              checked: false,
            },
          ],
        } as any,
      },
      {
        id: "patterns",
        type: "custom",
        position: { x: 100, y: 200 },
        style: { width: 280 },
        data: {
          label: "Patterns",
          type: "requirement",
          summary: "Common UI patterns",
          tags: ["patterns", "ux"],
          cards: [
            {
              id: "card-1",
              type: "text",
              content: "Navigation patterns, form layouts, modal patterns",
            },
          ],
        } as any,
      },
      {
        id: "documentation",
        type: "custom",
        position: { x: 100, y: 400 },
        style: { width: 280 },
        data: {
          label: "Documentation",
          type: "doc",
          summary: "Guidelines and examples",
          tags: ["docs", "storybook"],
          cards: [
            {
              id: "card-1",
              type: "todo",
              content: "Component usage guidelines",
              checked: false,
            },
            {
              id: "card-2",
              type: "todo",
              content: "Code examples",
              checked: false,
            },
          ],
        } as any,
      },
    ],
    edges: [
      { id: "e-center-tokens", source: "center", target: "tokens", type: "custom" },
      { id: "e-center-components", source: "center", target: "components", type: "custom" },
      { id: "e-center-patterns", source: "center", target: "patterns", type: "custom" },
      { id: "e-center-documentation", source: "center", target: "documentation", type: "custom" },
      { id: "e-tokens-components", source: "tokens", target: "components", type: "custom" },
    ],
    metadata: {
      createdAt: new Date("2025-01-01"),
      author: "FlowForge",
      tags: ["design", "design-system", "ui"],
    },
  },
];

// Local storage keys
const CUSTOM_TEMPLATES_KEY = "flowforge_custom_templates";

// Get all templates (built-in + custom)
export function getAllTemplates(): Template[] {
  const customTemplates = getCustomTemplates();
  return [...BUILT_IN_TEMPLATES, ...customTemplates];
}

// Get only custom templates
export function getCustomTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Convert date strings back to Date objects
    return parsed.map((t: any) => ({
      ...t,
      metadata: {
        ...t.metadata,
        createdAt: new Date(t.metadata.createdAt),
      },
    }));
  } catch (error) {
    console.error("Error loading custom templates:", error);
    return [];
  }
}

// Save custom templates to localStorage
function saveCustomTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("Error saving custom templates:", error);
    throw new Error("Failed to save templates");
  }
}

// Save a new template
export function saveTemplate(
  name: string,
  description: string,
  category: Template["category"],
  nodes: Node[],
  edges: Edge[],
  tags: string[] = []
): Template {
  const customTemplates = getCustomTemplates();
  
  const newTemplate: Template = {
    id: `custom-${Date.now()}`,
    name,
    description,
    category,
    isBuiltIn: false,
    nodes: nodes.map((node) => ({
      ...node,
      // Strip out callbacks and dynamic data
      data: {
        ...node.data,
        onAddCard: undefined,
        onUpdateCard: undefined,
        onDeleteCard: undefined,
        onExpandCard: undefined,
        onDragNewNode: undefined,
        onDragPreviewUpdate: undefined,
        onPlacingModeChange: undefined,
        onEditingChange: undefined,
        onDuplicate: undefined,
        onDelete: undefined,
        onExportJSON: undefined,
        onExportMarkdown: undefined,
        onCopyData: undefined,
        onExportSubgraphJSON: undefined,
        onExportSubgraphMarkdown: undefined,
        onEnrichWithAI: undefined,
        isNew: undefined,
        isPlacingFromThisNode: undefined,
        enrichmentCount: undefined,
      },
    })),
    edges: edges.map((edge) => ({
      ...edge,
      // Strip out any dynamic data
      data: edge.data ? { ...edge.data } : undefined,
    })),
    metadata: {
      createdAt: new Date(),
      author: "User",
      tags,
    },
  };

  customTemplates.push(newTemplate);
  saveCustomTemplates(customTemplates);
  
  return newTemplate;
}

// Delete a custom template
export function deleteTemplate(templateId: string): void {
  const customTemplates = getCustomTemplates();
  const filtered = customTemplates.filter((t) => t.id !== templateId);
  
  if (filtered.length === customTemplates.length) {
    throw new Error("Template not found or cannot delete built-in template");
  }
  
  saveCustomTemplates(filtered);
}

// Get template by ID
export function getTemplateById(templateId: string): Template | undefined {
  return getAllTemplates().find((t) => t.id === templateId);
}

// Get templates by category
export function getTemplatesByCategory(category: Template["category"]): Template[] {
  return getAllTemplates().filter((t) => t.category === category);
}

// Search templates
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.metadata.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
