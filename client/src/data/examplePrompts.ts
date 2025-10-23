/**
 * Example prompts for AI workspace generation
 * Users can click to quickly populate the prompt input
 */

export interface ExamplePrompt {
  title: string
  category: 'Web' | 'Mobile' | 'Backend' | 'Fullstack' | 'Data' | 'AI'
  prompt: string
  description: string
}

export const examplePrompts: ExamplePrompt[] = [
  {
    title: 'E-Commerce Platform',
    category: 'Fullstack',
    prompt:
      'Build a modern e-commerce platform with React frontend for browsing and shopping, Node.js/Express backend API, PostgreSQL database, Stripe payment integration, JWT authentication, and admin dashboard. Include product catalog, shopping cart, order management, and user reviews.',
    description: 'Full-featured online store with payments'
  },
  {
    title: 'Fitness Tracking App',
    category: 'Mobile',
    prompt:
      'Create a mobile fitness tracking app using React Native for iOS and Android. Features: workout logging, progress tracking, calorie counting, social features to share achievements, push notifications, integration with wearables, and backend API built with Node.js and MongoDB.',
    description: 'Cross-platform fitness application'
  },
  {
    title: 'Real-Time Chat System',
    category: 'Fullstack',
    prompt:
      'Build a real-time chat application with Vue/React frontend, Node.js backend with WebSockets, MongoDB for messages, Redis for caching, JWT authentication, user profiles, group chat rooms, file sharing, and message search. Include typing indicators and read receipts.',
    description: 'Instant messaging platform'
  },
  {
    title: 'Machine Learning Pipeline',
    category: 'Data',
    prompt:
      'Design a machine learning pipeline for image classification using Python, TensorFlow, and scikit-learn. Include data preprocessing, model training, validation, testing, API endpoint for inference, Flask/FastAPI server, and monitoring dashboard. Support model versioning and A/B testing.',
    description: 'ML ops and model serving'
  },
  {
    title: 'Microservices Ride-Sharing',
    category: 'Backend',
    prompt:
      'Create a microservices architecture for a ride-sharing platform. Services: user management, driver management, trip matching, payment processing, notifications. Use Node.js, Docker, Kubernetes, PostgreSQL, MongoDB, Redis, RabbitMQ, with API Gateway.',
    description: 'Scalable distributed system'
  },
  {
    title: 'Content Management System',
    category: 'Fullstack',
    prompt:
      'Build a headless CMS with Next.js frontend, GraphQL API, PostgreSQL database, file upload to S3, user roles and permissions, rich text editor with markdown support, content versioning, SEO optimization, and webhook integrations.',
    description: 'Flexible content platform'
  },
  {
    title: 'Analytics Dashboard',
    category: 'Web',
    prompt:
      'Create an analytics dashboard using React, D3.js/Chart.js for visualizations, Redux for state management, Node.js backend, TimescaleDB for time-series data, real-time updates with WebSockets, custom reports, data export to CSV/PDF.',
    description: 'Business intelligence tool'
  },
  {
    title: 'Social Network',
    category: 'Fullstack',
    prompt:
      'Design a social network platform with user profiles, friend connections, feeds, messaging, notifications, image galleries, comments and likes, hashtags, trending topics. Frontend: React/Vue, Backend: Node.js, Database: MongoDB, Cache: Redis.',
    description: 'Full-featured social platform'
  },
  {
    title: 'Project Management Tool',
    category: 'Fullstack',
    prompt:
      'Build a project management tool with React frontend, Node.js backend, real-time collaboration, task boards (Kanban), Gantt charts, team management, file attachments, comments, time tracking, and integrations with GitHub, Slack.',
    description: 'Team collaboration software'
  },
  {
    title: 'Video Streaming Service',
    category: 'Backend',
    prompt:
      'Create a video streaming platform backend with Node.js, HLS/DASH streaming protocols, video transcoding pipeline, CDN integration, MongoDB for metadata, Redis for caching, JWT auth, user watch history, recommendations engine.',
    description: 'Media delivery platform'
  },
  {
    title: 'AI Chatbot',
    category: 'AI',
    prompt:
      'Build an AI chatbot application with React frontend, Node.js backend, OpenAI/Claude API integration, conversation history storage in PostgreSQL, fine-tuning on custom data, rate limiting, analytics, and knowledge base management.',
    description: 'LLM-powered assistant'
  },
  {
    title: 'Online Learning Platform',
    category: 'Fullstack',
    prompt:
      'Develop an online learning platform with course creation, video lectures, quizzes, student progress tracking, certificates, live classes with video conferencing, discussion forums, and payment processing. React frontend, Node.js/Express backend.',
    description: 'EdTech platform'
  },
  {
    title: 'IoT Home Automation',
    category: 'Backend',
    prompt:
      'Create an IoT home automation system with device management, real-time control, Node.js backend API, MQTT broker for device communication, time-based automation rules, mobile app integration, energy monitoring, security alerts.',
    description: 'Smart home platform'
  },
  {
    title: 'DevOps Monitoring',
    category: 'Backend',
    prompt:
      'Build a DevOps monitoring and alerting system with Prometheus integration, Grafana dashboards, log aggregation with ELK, real-time alerts via Slack/email, performance metrics, infrastructure as code, automated remediation.',
    description: 'Infrastructure monitoring'
  },
  {
    title: 'Booking & Reservation System',
    category: 'Fullstack',
    prompt:
      'Create a booking system for accommodations/services with React frontend, availability calendar, payment integration, email confirmations, user reviews, admin management panel, Node.js backend, PostgreSQL database.',
    description: 'Reservation platform'
  }
]

/**
 * Get prompts by category
 */
export const getPromptsByCategory = (category: ExamplePrompt['category']) => {
  return examplePrompts.filter((p) => p.category === category)
}

/**
 * Get all categories
 */
export const getAllCategories = (): ExamplePrompt['category'][] => {
  return Array.from(new Set(examplePrompts.map((p) => p.category)))
}

/**
 * Get a random prompt
 */
export const getRandomPrompt = (): ExamplePrompt => {
  return examplePrompts[Math.floor(Math.random() * examplePrompts.length)]
}

export default examplePrompts
