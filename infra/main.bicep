targetScope = 'subscription'

@minLength(2)
@maxLength(32)
param environmentName string

param location string
param principalId string = ''
param resourceGroupName string = 'rg-foundry-opt-${environmentName}'
param tags object = {
  'azd-env-name': environmentName
  solution: 'foundry-agent-optimization-demo'
}

@description('Set false to provision Foundry without the demo web app and App Service cost.')
param deployWebApp bool = true

@description('App Service plan SKU. B1 is practical for demos; choose a different SKU to match tenant policy.')
param appServiceSku string = 'B1'

@description('Allow account keys as a fallback. Microsoft Entra ID remains the default.')
param allowApiKeyAuth bool = false

@description('Connect Application Insights to the Foundry project for server-side agent tracing.')
param connectApplicationInsights bool = true

@description('Deploy the model-router preview deployment. False by default because API and regional support are preview.')
param deployModelRouter bool = false

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
    principalId: principalId
    tags: tags
    deployWebApp: deployWebApp
    appServiceSku: appServiceSku
    allowApiKeyAuth: allowApiKeyAuth
    connectApplicationInsights: connectApplicationInsights
    deployModelRouter: deployModelRouter
    modelRouterVersion: modelRouterVersion
    modelRouterCapacity: modelRouterCapacity
    modelDeployments: modelDeployments
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_LOCATION string = location
output AZURE_WEB_APP_NAME string = resources.outputs.webAppName
output AZURE_WEB_APP_URI string = resources.outputs.webAppUri
output FOUNDRY_ACCOUNT_NAME string = resources.outputs.foundryAccountName
output FOUNDRY_PROJECT_NAME string = resources.outputs.foundryProjectName
output FOUNDRY_PROJECT_ENDPOINT string = resources.outputs.foundryProjectEndpoint
output FOUNDRY_AGENT_NAME string = resources.outputs.agentName
output APPLICATIONINSIGHTS_NAME string = resources.outputs.applicationInsightsName
output LOG_ANALYTICS_WORKSPACE_NAME string = resources.outputs.logAnalyticsWorkspaceName
output MODEL_ROUTER_DEPLOYMENT_NAME string = resources.outputs.modelRouterDeploymentName
