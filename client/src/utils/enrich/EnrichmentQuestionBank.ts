export type NodeType = "root" | "frontend" | "backend" | "requirement" | "doc";

export type Question = { 
  id: string; 
  label: string; 
  placeholder?: string;
  optional?: boolean;
};

export const QUESTION_BANK: Record<NodeType, Question[]> = {
  root: [
    { 
      id: "q1", 
      label: "What is the main goal of this project?",
      placeholder: "e.g., Build a customer management platform..."
    },
    { 
      id: "q2", 
      label: "Who are the primary users/stakeholders?",
      placeholder: "e.g., Sales team, managers, customers..."
    },
    { 
      id: "q3", 
      label: "What defines success (KPIs/outcomes)?",
      placeholder: "e.g., 50% faster onboarding, 90% user satisfaction..."
    },
  ],
  frontend: [
    { 
      id: "q1", 
      label: "Which screens/components are needed?",
      placeholder: "e.g., Login page, dashboard, user profile..."
    },
    { 
      id: "q2", 
      label: "What interactions/state should they support?",
      placeholder: "e.g., Form validation, real-time updates, filters..."
    },
    { 
      id: "q3", 
      label: "What data must be displayed/validated?",
      placeholder: "e.g., User info, analytics, permissions..."
    },
  ],
  backend: [
    { 
      id: "q1", 
      label: "Which APIs/endpoints are required?",
      placeholder: "e.g., GET /users, POST /orders, DELETE /items..."
    },
    { 
      id: "q2", 
      label: "What business rules/workflows run server-side?",
      placeholder: "e.g., Payment processing, email notifications, data validation..."
    },
    { 
      id: "q3", 
      label: "What data models/relations are involved?",
      placeholder: "e.g., User has many Orders, Order belongs to User..."
    },
  ],
  requirement: [
    { 
      id: "q1", 
      label: "What is the core requirement?",
      placeholder: "e.g., Users must be able to export reports..."
    },
    { 
      id: "q2", 
      label: "Why is it critical now?",
      placeholder: "e.g., Compliance deadline, user requests, competitive pressure..."
    },
    { 
      id: "q3", 
      label: "What are the acceptance criteria?",
      placeholder: "e.g., Export in CSV/PDF, include all data, complete in < 5s..."
    },
  ],
  doc: [
    { 
      id: "q1", 
      label: "Who is the audience (devs, PMs, end users)?",
      placeholder: "e.g., Backend developers..."
    },
    { 
      id: "q2", 
      label: "What key topics must be covered?",
      placeholder: "e.g., Authentication, API endpoints, error handling..."
    },
    { 
      id: "q3", 
      label: "What deliverable format (README, ADR, guide)?",
      placeholder: "e.g., API reference guide, architecture decision record..."
    },
  ],
};

export function getQuestionsForNodeType(nodeType: NodeType): Question[] {
  return QUESTION_BANK[nodeType] || QUESTION_BANK.requirement;
}
