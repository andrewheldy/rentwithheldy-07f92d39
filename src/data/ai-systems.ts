export const businessFunctions = [
  "reservations",
  "guests",
  "vehicles",
  "airports",
  "maintenance",
  "utilization",
  "partnerships",
  "marketing",
  "sales",
  "service",
  "research",
  "documentation",
  "operations",
  "growth",
] as const;

export const heroNodes = [
  "customers",
  "fleet",
  "operations",
  "sales",
  "research",
  "marketing",
  "finance",
  "knowledge",
  "automation",
] as const;

export const workflowStages = [
  "inquiry",
  "channels",
  "capture",
  "qualification",
  "reservation",
  "experience",
] as const;

export const workflowBranches = [
  "operations",
  "fleet",
  "analytics",
  "marketing",
  "followUp",
  "partnerships",
  "knowledge",
] as const;

export const systemCategories = [
  "customerExperience",
  "operations",
  "fleetIntelligence",
  "salesGrowth",
  "research",
  "vehicleAcquisition",
  "productDevelopment",
] as const;

export const beforeSteps = [
  "read",
  "availability",
  "information",
  "response",
  "update",
  "reminder",
  "remember",
] as const;

export const afterSteps = [
  "context",
  "classify",
  "retrieve",
  "prepare",
  "update",
  "schedule",
  "exceptions",
] as const;

export const artifacts = [
  { id: "voice", flow: ["call", "transcript", "knowledge", "action"] },
  { id: "fleet", flow: ["vehicles", "utilization", "revenue", "performance"] },
  { id: "research", flow: ["question", "sources", "synthesis", "recommendation"] },
  { id: "sop", flow: ["documents", "knowledge", "answer"] },
  { id: "partnership", flow: ["prospects", "research", "qualification", "outreach", "crm"] },
  { id: "acquisition", flow: ["candidates", "data", "analysis", "decision"] },
] as const;

export const industries = [
  "hotel",
  "propertyManagement",
  "homeServices",
  "restaurant",
  "lawFirm",
  "automotive",
  "professionalServices",
  "repeatableOperations",
] as const;

export const opportunityProblems = [
  "customerQuestions",
  "research",
  "followUp",
  "dataEntry",
  "scheduling",
  "quoting",
  "reporting",
  "training",
  "leadGeneration",
  "documentation",
  "internalSearch",
  "repetitiveDecisions",
  "operations",
  "qualityControl",
] as const;

export type OpportunityProblem = (typeof opportunityProblems)[number];

export const recommendationIds = [
  "knowledgeSystem",
  "workflowAutomation",
  "aiAssistant",
  "decisionSupport",
  "customerAutomation",
] as const;

export type RecommendationId = (typeof recommendationIds)[number];

export const opportunityMap: Record<OpportunityProblem, RecommendationId[]> = {
  customerQuestions: ["knowledgeSystem", "aiAssistant", "customerAutomation"],
  research: ["knowledgeSystem", "decisionSupport"],
  followUp: ["workflowAutomation", "customerAutomation"],
  dataEntry: ["workflowAutomation"],
  scheduling: ["workflowAutomation", "aiAssistant"],
  quoting: ["decisionSupport", "customerAutomation"],
  reporting: ["workflowAutomation", "decisionSupport"],
  training: ["knowledgeSystem", "aiAssistant"],
  leadGeneration: ["workflowAutomation", "aiAssistant", "customerAutomation"],
  documentation: ["knowledgeSystem", "workflowAutomation"],
  internalSearch: ["knowledgeSystem", "aiAssistant"],
  repetitiveDecisions: ["decisionSupport", "aiAssistant"],
  operations: ["workflowAutomation", "decisionSupport"],
  qualityControl: ["knowledgeSystem", "decisionSupport"],
};

export const processSteps = ["find", "build", "integrate", "improve"] as const;

