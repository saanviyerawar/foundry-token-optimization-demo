param environmentName string
param location string
param searchLocation string
param principalId string
param tags object
param allowApiKeyAuth bool
param connectApplicationInsights bool
param deployModelRouter bool
param deployFoundryIQ bool
param deployBrowserAutomation bool
param modelRouterVersion string
param modelRouterCapacity int
param modelDeployments array

var suffix = uniqueString(subscription().id, resourceGroup().id, environmentName)
var foundryAccountName = take('foundry-opt-${environmentName}-${suffix}', 64)
var foundryProjectName = take('optimization-demo-${environmentName}', 64)
var logAnalyticsName = take('log-foundry-opt-${environmentName}-${suffix}', 63)
var applicationInsightsName = take('appi-foundry-opt-${environmentName}-${suffix}', 255)
var searchServiceName = take('srch-foundry-opt-${environmentName}-${suffix}', 60)
var playwrightWorkspaceName = take('pww-${environmentName}-${suffix}', 24)
var agentName = 'foundry-optimization-agent'
var foundryProjectEndpoint = 'https://${foundryAccountName}.services.ai.azure.com/api/projects/${foundryProjectName}'
var foundryAccountEndpoint = 'https://${foundryAccountName}.cognitiveservices.azure.com'
var searchServiceEndpoint = 'https://${searchServiceName}.search.windows.net'
var modelRouterDeploymentName = 'model-router'
var knowledgeIndexName = 'token-optimization-index'
var knowledgeSourceName = 'token-optimization-source'
var knowledgeBaseName = 'token-optimization-knowledge'
var knowledgeConnectionName = 'token-optimization-knowledge'
var browserAutomationConnectionName = 'youtube-browser-automation'
var foundryUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '53ca6127-db72-4b80-b1b0-d745d6d5456d')
var cognitiveServicesUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'a97b65f3-24c7-4388-baec-2e87135dc908')
var searchServiceContributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7ca78c08-252a-4471-8644-bb5ff32d4ba0')
var searchIndexDataContributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '8ebe5a00-799e-43f5-93ac-243d3dce84a7')
var searchIndexDataReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '1407120a-92aa-4202-b7e9-c0e197c71c8f')
var logAnalyticsReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '73c42c96-874c-492b-b04d-ab87d138a893')
var privilegedMonitoringReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'dbc9c667-e97f-4491-aee6-90b9cf960190')
var playwrightWorkspaceContributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '78cf819f-0969-4ebe-8759-015c6efcd5bf')

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
  }
}

resource foundryAccount 'Microsoft.CognitiveServices/accounts@2025-06-01' = {
  name: foundryAccountName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'S0'
  }
  kind: 'AIServices'
  tags: tags
  properties: {
    allowProjectManagement: true
    customSubDomainName: foundryAccountName
    disableLocalAuth: !allowApiKeyAuth
    publicNetworkAccess: 'Enabled'
  }
}

resource foundryProject 'Microsoft.CognitiveServices/accounts/projects@2025-06-01' = {
  name: foundryProjectName
  parent: foundryAccount
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
  properties: {
    displayName: 'Foundry Agent Optimization Demo'
    description: 'Tenant-owned demonstration of routing, tool compression, retrieval, caching, traces, telemetry, and evaluations.'
  }
}

resource searchService 'Microsoft.Search/searchServices@2025-05-01' = if (deployFoundryIQ) {
  name: searchServiceName
  location: searchLocation
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'basic'
  }
  tags: tags
  properties: {
    disableLocalAuth: true
    hostingMode: 'Default'
    partitionCount: 1
    publicNetworkAccess: 'enabled'
    replicaCount: 1
    semanticSearch: 'free'
  }
}

resource playwrightWorkspace 'Microsoft.LoadTestService/playwrightWorkspaces@2025-09-01' = if (deployBrowserAutomation) {
  name: playwrightWorkspaceName
  location: location
  tags: tags
  properties: {
    regionalAffinity: 'Enabled'
  }
}

@batchSize(1)
resource directModelDeployments 'Microsoft.CognitiveServices/accounts/deployments@2025-06-01' = [for deployment in modelDeployments: if (deployment.enabled) {
  name: deployment.deploymentName
  parent: foundryAccount
  dependsOn: [
    foundryProject
  ]
  sku: {
    name: deployment.skuName
    capacity: deployment.capacity
  }
  properties: {
    model: {
      format: deployment.modelFormat
      name: deployment.modelName
      version: deployment.modelVersion
    }
  }
}]

resource modelRouterDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-10-01-preview' = if (deployModelRouter) {
  name: modelRouterDeploymentName
  parent: foundryAccount
  dependsOn: [
    directModelDeployments
  ]
  sku: {
    name: 'GlobalStandard'
    capacity: modelRouterCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'model-router'
      version: modelRouterVersion
    }
  }
}

resource projectFoundryUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: foundryAccount
  name: guid(foundryProject.id, foundryUserRoleId)
  properties: {
    principalId: foundryProject.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: foundryUserRoleId
  }
}

resource presenterFoundryUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  scope: foundryProject
  name: guid(foundryProject.id, principalId, foundryUserRoleId)
  properties: {
    principalId: principalId
    roleDefinitionId: foundryUserRoleId
  }
}

resource projectPlaywrightContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployBrowserAutomation) {
  scope: playwrightWorkspace!
  name: guid(foundryProject.id, playwrightWorkspace!.id, playwrightWorkspaceContributorRoleId)
  properties: {
    principalId: foundryProject.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: playwrightWorkspaceContributorRoleId
  }
}

resource searchModelUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployFoundryIQ) {
  scope: foundryAccount
  name: guid(searchService!.id, foundryAccount.id, cognitiveServicesUserRoleId)
  properties: {
    principalId: searchService!.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: cognitiveServicesUserRoleId
  }
}

resource projectSearchReader 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployFoundryIQ) {
  scope: searchService!
  name: guid(foundryProject.id, searchService!.id, searchIndexDataReaderRoleId)
  properties: {
    principalId: foundryProject.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: searchIndexDataReaderRoleId
  }
}

resource presenterSearchRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for roleId in [
  searchServiceContributorRoleId
  searchIndexDataContributorRoleId
]: if (deployFoundryIQ && !empty(principalId)) {
  scope: searchService!
  name: guid(principalId, searchService!.id, roleId)
  properties: {
    principalId: principalId
    roleDefinitionId: roleId
  }
}]

resource accountAppInsightsConnection 'Microsoft.CognitiveServices/accounts/connections@2025-06-01' = if (connectApplicationInsights) {
  name: '${foundryAccountName}-appinsights'
  parent: foundryAccount
  dependsOn: [
    directModelDeployments
    modelRouterDeployment
  ]
  properties: {
    category: 'AppInsights'
    target: applicationInsights.id
    authType: 'ApiKey'
    isSharedToAll: true
    credentials: {
      key: applicationInsights.properties.ConnectionString
    }
    metadata: {
      ApiType: 'Azure'
      ResourceId: applicationInsights.id
    }
  }
}

resource projectAppInsightsConnection 'Microsoft.CognitiveServices/accounts/projects/connections@2025-06-01' = if (connectApplicationInsights) {
  name: applicationInsightsName
  parent: foundryProject
  dependsOn: [
    accountAppInsightsConnection
  ]
  properties: {
    category: 'AppInsights'
    target: applicationInsights.id
    authType: 'ApiKey'
    isSharedToAll: true
    credentials: {
      key: applicationInsights.properties.ConnectionString
    }
    metadata: {
      ApiType: 'Azure'
      ResourceId: applicationInsights.id
    }
  }
}

resource projectBrowserAutomationConnection 'Microsoft.CognitiveServices/accounts/projects/connections@2025-04-01-preview' = if (deployBrowserAutomation) {
  name: browserAutomationConnectionName
  parent: foundryProject
  dependsOn: [
    directModelDeployments
    modelRouterDeployment
    accountAppInsightsConnection
    projectAppInsightsConnection
  ]
  properties: {
    category: 'PlaywrightWorkspace'
    target: '${replace(playwrightWorkspace!.properties.dataplaneUri, 'https://', 'wss://')}/browsers'
    authType: 'ProjectManagedIdentity'
    audience: 'https://management.core.windows.net'
    isSharedToAll: true
    credentials: null
    metadata: {
      resourceId: playwrightWorkspace!.id
    }
  }
}

resource projectMonitoringRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for roleId in [
  logAnalyticsReaderRoleId
  privilegedMonitoringReaderRoleId
]: if (connectApplicationInsights) {
  scope: applicationInsights
  name: guid(foundryProject.id, applicationInsights.id, roleId)
  properties: {
    principalId: foundryProject.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: roleId
  }
}]

resource presenterMonitoringRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for roleId in [
  logAnalyticsReaderRoleId
  privilegedMonitoringReaderRoleId
]: if (connectApplicationInsights && !empty(principalId)) {
  scope: applicationInsights
  name: guid(principalId, applicationInsights.id, roleId)
  properties: {
    principalId: principalId
    roleDefinitionId: roleId
  }
}]

output foundryAccountName string = foundryAccount.name
output foundryAccountEndpoint string = foundryAccountEndpoint
output foundryProjectResourceId string = foundryProject.id
output foundryProjectName string = foundryProject.name
output foundryProjectEndpoint string = foundryProjectEndpoint
output agentName string = agentName
output applicationInsightsName string = applicationInsights.name
output logAnalyticsWorkspaceName string = logAnalytics.name
output modelRouterDeploymentName string = deployModelRouter ? modelRouterDeployment.name : ''
output searchServiceName string = deployFoundryIQ ? searchService!.name : ''
output searchServiceEndpoint string = deployFoundryIQ ? searchServiceEndpoint : ''
output knowledgeIndexName string = deployFoundryIQ ? knowledgeIndexName : ''
output knowledgeSourceName string = deployFoundryIQ ? knowledgeSourceName : ''
output knowledgeBaseName string = deployFoundryIQ ? knowledgeBaseName : ''
output knowledgeConnectionName string = deployFoundryIQ ? knowledgeConnectionName : ''
output browserAutomationConnectionId string = deployBrowserAutomation ? projectBrowserAutomationConnection.id : ''
output playwrightWorkspaceName string = deployBrowserAutomation ? playwrightWorkspace!.name : ''
