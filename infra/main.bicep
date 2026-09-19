targetScope = 'subscription'

@minLength(2)
@maxLength(32)
param environmentName string

param location string
@description('Azure AI Search location. Override when the primary region has no Search capacity.')
param searchLocation string = location
param principalId string = ''
param resourceGroupName string = 'rg-foundry-opt-${environmentName}'
param tags object = {
  'azd-env-name': environmentName
  solution: 'foundry-agent-optimization-demo'
}

@description('Allow account keys as a fallback. Microsoft Entra ID remains the default.')
param allowApiKeyAuth bool = false

@description('Connect Application Insights to the Foundry project for server-side agent tracing.')
param connectApplicationInsights bool = true

@description('Deploy the model-router preview deployment used by the portal demo.')
param deployModelRouter bool = true

@description('Deploy Azure AI Search for the Foundry IQ portal demo. This creates an additional billable resource.')
param deployFoundryIQ bool = true

@description('Deploy a Playwright workspace and Foundry Browser Automation connection for direct YouTube transcript access.')
param deployBrowserAutomation bool = true

@description('Model router version from the current Microsoft Foundry model-router documentation.')
param modelRouterVersion string = '2025-11-18'

@description('Model router TPM capacity in thousands.')
@minValue(1)
param modelRouterCapacity int = 10

@description('Configurable direct model deployments. Disable or change versions/SKUs based on regional availability and quota.')
param modelDeployments array = [
  {
    enabled: true
    deploymentName: 'gpt-5-mini'
    modelName: 'gpt-5-mini'
    modelVersion: '2025-08-07'
    modelFormat: 'OpenAI'
    skuName: 'GlobalStandard'
    capacity: 10
  }
  {
    enabled: true
    deploymentName: 'gpt-5-nano'
    modelName: 'gpt-5-nano'
    modelVersion: '2025-08-07'
    modelFormat: 'OpenAI'
    skuName: 'GlobalStandard'
    capacity: 10
  }
  {
    enabled: true
    deploymentName: 'gpt-4-1-mini'
    modelName: 'gpt-4.1-mini'
    modelVersion: '2025-04-14'
    modelFormat: 'OpenAI'
    skuName: 'GlobalStandard'
    capacity: 10
  }
]

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module resources './resources.bicep' = {
  name: 'foundry-optimization-${environmentName}'
  scope: resourceGroup
  params: {
    environmentName: environmentName
    location: location
    searchLocation: searchLocation
    principalId: principalId
    tags: tags
    allowApiKeyAuth: allowApiKeyAuth
    connectApplicationInsights: connectApplicationInsights
    deployModelRouter: deployModelRouter
    deployFoundryIQ: deployFoundryIQ
    deployBrowserAutomation: deployBrowserAutomation
    modelRouterVersion: modelRouterVersion
    modelRouterCapacity: modelRouterCapacity
    modelDeployments: modelDeployments
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_LOCATION string = location
output FOUNDRY_ACCOUNT_NAME string = resources.outputs.foundryAccountName
output FOUNDRY_ACCOUNT_ENDPOINT string = resources.outputs.foundryAccountEndpoint
output FOUNDRY_PROJECT_RESOURCE_ID string = resources.outputs.foundryProjectResourceId
output FOUNDRY_PROJECT_NAME string = resources.outputs.foundryProjectName
output FOUNDRY_PROJECT_ENDPOINT string = resources.outputs.foundryProjectEndpoint
output FOUNDRY_AGENT_NAME string = resources.outputs.agentName
output APPLICATIONINSIGHTS_NAME string = resources.outputs.applicationInsightsName
output LOG_ANALYTICS_WORKSPACE_NAME string = resources.outputs.logAnalyticsWorkspaceName
output MODEL_ROUTER_DEPLOYMENT_NAME string = resources.outputs.modelRouterDeploymentName
output SEARCH_SERVICE_NAME string = resources.outputs.searchServiceName
output SEARCH_SERVICE_ENDPOINT string = resources.outputs.searchServiceEndpoint
output FOUNDRY_IQ_INDEX_NAME string = resources.outputs.knowledgeIndexName
output FOUNDRY_IQ_SOURCE_NAME string = resources.outputs.knowledgeSourceName
output FOUNDRY_IQ_KNOWLEDGE_BASE_NAME string = resources.outputs.knowledgeBaseName
output FOUNDRY_IQ_CONNECTION_NAME string = resources.outputs.knowledgeConnectionName
output BROWSER_AUTOMATION_CONNECTION_ID string = resources.outputs.browserAutomationConnectionId
output PLAYWRIGHT_WORKSPACE_NAME string = resources.outputs.playwrightWorkspaceName
