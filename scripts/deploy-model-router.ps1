param(
    [string]$Version = "2025-11-18",
    [int]$Capacity = 10
)

$ErrorActionPreference = "Stop"
Write-Warning "Model router uses the 2025-10-01-preview management API and creates billable GlobalStandard capacity."

$subscriptionId = & az account show --query id -o tsv
if ($LASTEXITCODE -ne 0) { throw "Run az login and select the intended subscription first." }
$resourceGroup = (& azd env get-value AZURE_RESOURCE_GROUP).Trim()
$accountName = (& azd env get-value FOUNDRY_ACCOUNT_NAME).Trim()
$deploymentName = "model-router"
$uri = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.CognitiveServices/accounts/$accountName/deployments/$deploymentName`?api-version=2025-10-01-preview"
$body = @{
    sku = @{ name = "GlobalStandard"; capacity = $Capacity }
    properties = @{ model = @{ format = "OpenAI"; name = "model-router"; version = $Version } }
} | ConvertTo-Json -Depth 6 -Compress

& az rest --method put --uri $uri --headers "Content-Type=application/json" --body $body
if ($LASTEXITCODE -ne 0) { throw "Model router deployment failed. Confirm regional availability, policy, and quota." }
& azd env set MODEL_ROUTER_DEPLOYMENT_NAME $deploymentName | Out-Null
Write-Host "Model router deployment is ready as $deploymentName."
