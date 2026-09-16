param environmentName string
param location string
param principalId string
param tags object
param deployWebApp bool
param appServiceSku string
param allowApiKeyAuth bool
param connectApplicationInsights bool
param deployModelRouter bool
param modelRouterVersion string
param modelRouterCapacity int
param modelDeployments array

var suffix = uniqueString(subscription().id, resourceGroup().id, environmentName)
var foundryAccountName = take('foundry-opt-${environmentName}-${suffix}', 64)
var foundryProjectName = take('optimization-demo-${environmentName}', 64)
var appServicePlanName = take('plan-foundry-opt-${environmentName}', 40)
var webAppName = take('app-foundry-opt-${environmentName}-${suffix}', 60)
var logAnalyticsName = take('log-foundry-opt-${environmentName}-${suffix}', 63)
var applicationInsightsName = take('appi-foundry-opt-${environmentName}-${suffix}', 255)
var agentName = 'foundry-optimization-agent'
var foundryProjectEndpoint = 'https://${foundryAccountName}.services.ai.azure.com/api/projects/${foundryProjectName}'
var modelRouterDeploymentName = 'model-router'
var foundryUserRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '53ca6127-db72-4b80-b1b0-d745d6d5456d')
var logAnalyticsReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '73c42c96-874c-492b-b04d-ab87d138a893')
var privilegedMonitoringReaderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'dbc9c667-e97f-4491-aee6-90b9cf960190')

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

resource directModelDeployments 'Microsoft.CognitiveServices/accounts/deployments@2025-06-01' = [for deployment in modelDeployments: if (deployment.enabled) {
  name: deployment.deploymentName
  parent: foundryAccount
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

resource accountAppInsightsConnection 'Microsoft.CognitiveServices/accounts/connections@2025-06-01' = if (connectApplicationInsights) {
  name: '${foundryAccountName}-appinsights'
  parent: foundryAccount
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

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = if (deployWebApp) {
  name: appServicePlanName
  location: location
  kind: 'linux'
  tags: tags
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = if (deployWebApp) {
  name: webAppName
  location: location
  kind: 'app,linux'
  tags: union(tags, {
    'azd-service-name': 'web'
  })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appCommandLine: 'npm start'
      alwaysOn: appServiceSku != 'F1'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'AI_PROVIDER'
          value: 'foundry'
        }
        {
          name: 'FOUNDRY_PROJECT_ENDPOINT'
          value: foundryProjectEndpoint
        }
        {
          name: 'FOUNDRY_AGENT_NAME'
          value: agentName
        }
        {
          name: 'FOUNDRY_USE_AGENT'
          value: 'false'
        }
        {
          name: 'MODEL_DEPLOYMENT_GPT_5_NANO'
          value: 'gpt-5-nano'
        }
        {
          name: 'MODEL_DEPLOYMENT_GPT_5_MINI'
          value: 'gpt-5-mini'
        }
        {
          name: 'MODEL_DEPLOYMENT_GPT_4_1_MINI'
          value: 'gpt-4-1-mini'
        }
        {
          name: 'MODEL_DEPLOYMENT_CLAUDE_OPUS_5'
          value: 'gpt-5-mini'
        }
        {
          name: 'MODEL_ROUTER_DEPLOYMENT_NAME'
          value: deployModelRouter ? modelRouterDeploymentName : ''
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'DATA_DIRECTORY'
          value: '/home/data'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'ENABLE_ORYX_BUILD'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~22'
        }
        {
          name: 'NEXT_TELEMETRY_DISABLED'
          value: '1'
        }
      ]
    }
  }
}

resource webAppFoundryUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (deployWebApp) {
  scope: foundryProject
  name: guid(webAppName, foundryProject.id, foundryUserRoleId)
  properties: {
    principalId: webApp!.identity.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: foundryUserRoleId
  }
}

output foundryAccountName string = foundryAccount.name
output foundryProjectName string = foundryProject.name
output foundryProjectEndpoint string = foundryProjectEndpoint
output agentName string = agentName
output applicationInsightsName string = applicationInsights.name
output logAnalyticsWorkspaceName string = logAnalytics.name
output modelRouterDeploymentName string = deployModelRouter ? modelRouterDeployment.name : ''
output webAppName string = deployWebApp ? webApp.name : ''
output webAppUri string = deployWebApp ? 'https://${webAppName}.azurewebsites.net' : ''
