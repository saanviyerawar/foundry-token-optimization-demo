export interface ToolDefinition {
  name: string;
  description: string;
  schemaFields: number;
  toolbox: string;
}

export const tools: ToolDefinition[] = [
  { name: "crm_search", description: "Search customer records and opportunities", schemaFields: 12, toolbox: "CRM" },
  { name: "crm_update", description: "Update an opportunity milestone", schemaFields: 18, toolbox: "CRM" },
  { name: "crm_contacts", description: "List stakeholders for an account", schemaFields: 10, toolbox: "CRM" },
  { name: "policy_search", description: "Retrieve approved policy passages", schemaFields: 9, toolbox: "Knowledge" },
  { name: "document_fetch", description: "Fetch an approved document", schemaFields: 8, toolbox: "Knowledge" },
  { name: "calendar_find", description: "Find meeting availability", schemaFields: 14, toolbox: "Productivity" },
  { name: "email_draft", description: "Draft a customer email", schemaFields: 16, toolbox: "Productivity" },
  { name: "analytics_query", description: "Query aggregated operating metrics", schemaFields: 20, toolbox: "Analytics" },
  { name: "chart_render", description: "Render a chart from approved data", schemaFields: 13, toolbox: "Analytics" },
  { name: "incident_lookup", description: "Find active service incidents", schemaFields: 11, toolbox: "Support" },
  { name: "ticket_create", description: "Create a support ticket", schemaFields: 17, toolbox: "Support" },
  { name: "handoff_agent", description: "Escalate a task to a specialist", schemaFields: 9, toolbox: "Support" },
];

export function tokenEstimate(tool: ToolDefinition): number {
  return 22 + Math.ceil(tool.description.length / 4) + tool.schemaFields * 7;
}

export function toolboxMetrics(selectedToolbox = "CRM") {
  const individualTokens = tools.reduce((sum, tool) => sum + tokenEstimate(tool), 0);
  const selected = tools.filter((tool) => tool.toolbox === selectedToolbox);
  const groupedTokens = 58 + selected.reduce((sum, tool) => sum + tokenEstimate(tool), 0);
  const savings = Math.round((1 - groupedTokens / individualTokens) * 100);
  return {
    individualTokens,
    groupedTokens,
    savings,
    selectionAccuracyIndividual: 74,
    selectionAccuracyGrouped: 94,
    costReduction: Math.round(savings * 0.82),
    selectedCount: selected.length,
  };
}
