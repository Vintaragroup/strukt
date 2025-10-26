// @ts-nocheck
import { NodeType } from "./EnrichmentQuestionBank";
import { EditableCardData } from "../../components/EditableCard";

export interface EnrichmentAnswers {
  q1: string;
  q2: string;
  q3: string;
}

export interface GeneratedContent {
  textCards: EditableCardData[];
  todoCards: EditableCardData[];
  tags: string[];
  enhancedSummary: string;
  timestamp: number;
}

/**
 * Mock AI Generator - Creates realistic content based on user answers
 * This is deterministic and runs entirely client-side
 */
export class MockAIGenerator {
  private generateId(): string {
    return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate enriched content based on node type and user answers
   */
  generate(
    nodeType: NodeType,
    nodeLabel: string,
    currentSummary: string | undefined,
    answers: EnrichmentAnswers
  ): GeneratedContent {
    const timestamp = Date.now();

    switch (nodeType) {
      case "root":
        return this.generateRootContent(nodeLabel, answers, timestamp);
      case "frontend":
        return this.generateFrontendContent(nodeLabel, answers, timestamp);
      case "backend":
        return this.generateBackendContent(nodeLabel, answers, timestamp);
      case "requirement":
        return this.generateRequirementContent(nodeLabel, answers, timestamp);
      case "doc":
        return this.generateDocContent(nodeLabel, answers, timestamp);
      default:
        return this.generateGenericContent(nodeLabel, answers, timestamp);
    }
  }

  private generateRootContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**Project Overview**\n\n${answers.q1}\n\nThis initiative aims to deliver value to ${answers.q2} by focusing on measurable outcomes and clear success metrics.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Stakeholder Impact**\n\n${answers.q2} will benefit from this project through improved workflows, enhanced capabilities, and better outcomes. Key considerations include user feedback integration, change management, and stakeholder communication strategies.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Success Metrics**\n\n${answers.q3}\n\nThese KPIs will be tracked throughout the project lifecycle to ensure we're delivering value and meeting objectives. Regular reviews and adjustments will be made based on performance data.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Define project scope and boundaries", completed: false },
          { id: "2", text: "Identify all stakeholders and their needs", completed: false },
          { id: "3", text: "Establish success metrics and tracking methods", completed: false },
          { id: "4", text: "Create project timeline and milestones", completed: false },
          { id: "5", text: "Set up communication channels and cadence", completed: false },
          { id: "6", text: "Allocate resources and assign responsibilities", completed: false },
        ],
      },
    ];

    const tags = ["strategic", "high-priority", "planning", "stakeholder-driven"];

    const enhancedSummary = `${label}: ${answers.q1.split('.')[0]}. Success measured by ${answers.q3.split('.')[0]}.`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }

  private generateFrontendContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**UI Components & Screens**\n\n${answers.q1}\n\nEach component should follow our design system guidelines, maintain consistent styling, and provide excellent user experience across all device sizes.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Interaction Patterns**\n\n${answers.q2}\n\nImplement these interactions with proper loading states, error handling, and user feedback. Consider accessibility requirements (WCAG 2.1 AA) and keyboard navigation throughout.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Data Requirements**\n\n${answers.q3}\n\nEstablish clear data contracts with backend APIs. Implement proper validation, error messaging, and data transformation layers. Cache appropriately for performance.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Design component mockups and wireframes", completed: false },
          { id: "2", text: "Set up component library structure", completed: false },
          { id: "3", text: "Implement state management solution", completed: false },
          { id: "4", text: "Build reusable UI components", completed: false },
          { id: "5", text: "Integrate with backend APIs", completed: false },
          { id: "6", text: "Add form validation and error handling", completed: false },
          { id: "7", text: "Test across browsers and devices", completed: false },
          { id: "8", text: "Optimize bundle size and performance", completed: false },
        ],
      },
    ];

    const tags = ["ui-components", "user-experience", "responsive", "frontend"];

    const enhancedSummary = `Frontend implementation for ${label} including ${answers.q1.split(',')[0]} with ${answers.q2.split(',')[0]}.`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }

  private generateBackendContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**API Endpoints**\n\n${answers.q1}\n\nAll endpoints should follow RESTful conventions, include proper authentication/authorization, implement rate limiting, and return consistent error responses.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Business Logic**\n\n${answers.q2}\n\nImplement these workflows with proper transaction handling, error recovery, and logging. Consider edge cases, race conditions, and failure scenarios. Document all business rules clearly.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Data Models**\n\n${answers.q3}\n\nDesign database schema with proper normalization, indexes for query performance, and constraints for data integrity. Plan for migrations and backwards compatibility.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Design database schema and relationships", completed: false },
          { id: "2", text: "Set up API routing and middleware", completed: false },
          { id: "3", text: "Implement authentication and authorization", completed: false },
          { id: "4", text: "Build core business logic services", completed: false },
          { id: "5", text: "Add input validation and sanitization", completed: false },
          { id: "6", text: "Write unit and integration tests", completed: false },
          { id: "7", text: "Set up logging and monitoring", completed: false },
          { id: "8", text: "Document API with OpenAPI/Swagger", completed: false },
        ],
      },
    ];

    const tags = ["api", "backend", "server-side", "data-models"];

    const enhancedSummary = `Backend services for ${label} with ${answers.q1.split(',')[0]} supporting ${answers.q2.split('.')[0]}.`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }

  private generateRequirementContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**Core Requirement**\n\n${answers.q1}\n\nThis requirement addresses a critical business need and must be implemented with careful attention to user needs, technical constraints, and business objectives.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Business Justification**\n\n${answers.q2}\n\nThe urgency and importance of this requirement make it a top priority. Implementation should balance speed with quality, ensuring we deliver value quickly while maintaining standards.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Acceptance Criteria**\n\n${answers.q3}\n\nThese criteria define when the requirement is complete and ready for deployment. All criteria must be met and validated through testing before considering the work done.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Clarify requirements with stakeholders", completed: false },
          { id: "2", text: "Create technical specification document", completed: false },
          { id: "3", text: "Identify dependencies and blockers", completed: false },
          { id: "4", text: "Estimate effort and timeline", completed: false },
          { id: "5", text: "Design solution architecture", completed: false },
          { id: "6", text: "Implement core functionality", completed: false },
          { id: "7", text: "Test against acceptance criteria", completed: false },
          { id: "8", text: "Get stakeholder sign-off", completed: false },
        ],
      },
    ];

    const tags = ["requirement", "critical", "acceptance-criteria", "stakeholder"];

    const enhancedSummary = `${label}: ${answers.q1.split('.')[0]}. Critical due to ${answers.q2.split('.')[0]}.`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }

  private generateDocContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**Target Audience**\n\n${answers.q1}\n\nTailor the documentation level, terminology, and examples to match the audience's technical background and needs. Use appropriate tone and depth for effective communication.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Key Topics**\n\n${answers.q2}\n\nCover these topics comprehensively with clear explanations, code examples where relevant, diagrams for complex concepts, and troubleshooting guides for common issues.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Deliverable Format**\n\n${answers.q3}\n\nStructure the documentation for easy navigation, searchability, and maintenance. Include table of contents, cross-references, and version history. Keep it up-to-date with code changes.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Outline documentation structure", completed: false },
          { id: "2", text: "Gather technical information and details", completed: false },
          { id: "3", text: "Write draft content for each section", completed: false },
          { id: "4", text: "Create diagrams and visual aids", completed: false },
          { id: "5", text: "Add code examples and demos", completed: false },
          { id: "6", text: "Review with stakeholders for accuracy", completed: false },
          { id: "7", text: "Format and polish final version", completed: false },
          { id: "8", text: "Publish and communicate availability", completed: false },
        ],
      },
    ];

    const tags = ["documentation", "knowledge-sharing", "technical-writing", "guides"];

    const enhancedSummary = `${label} documentation for ${answers.q1.split(',')[0]} covering ${answers.q2.split(',')[0]}.`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }

  private generateGenericContent(
    label: string,
    answers: EnrichmentAnswers,
    timestamp: number
  ): GeneratedContent {
    const textCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "text",
        content: `**Overview**\n\n${answers.q1}\n\nThis component is essential to the overall system architecture and should be developed with attention to quality, maintainability, and performance.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Implementation Details**\n\n${answers.q2}\n\nCareful implementation of these aspects will ensure the component meets requirements and integrates smoothly with other system parts.`,
      },
      {
        id: this.generateId(),
        type: "text",
        content: `**Considerations**\n\n${answers.q3}\n\nThese factors should guide design decisions and implementation approach.`,
      },
    ];

    const todoCards: EditableCardData[] = [
      {
        id: this.generateId(),
        type: "todo",
        content: "",
        todos: [
          { id: "1", text: "Define requirements and scope", completed: false },
          { id: "2", text: "Design solution approach", completed: false },
          { id: "3", text: "Implement core functionality", completed: false },
          { id: "4", text: "Add error handling and validation", completed: false },
          { id: "5", text: "Write tests and documentation", completed: false },
          { id: "6", text: "Review and refine implementation", completed: false },
        ],
      },
    ];

    const tags = ["implementation", "development", "in-progress"];

    const enhancedSummary = `${label}: ${answers.q1.substring(0, 100)}...`;

    return { textCards, todoCards, tags, enhancedSummary, timestamp };
  }
}

export const aiGenerator = new MockAIGenerator();
