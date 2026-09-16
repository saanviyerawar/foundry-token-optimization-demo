param([string]$AssigneeObjectId = "")

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($AssigneeObjectId)) {
    $AssigneeObjectId = (& az ad signed-in-user show --query id -o tsv).Trim()
}
if ([string]::IsNullOrWhiteSpace($AssigneeObjectId)) { throw "Could not resolve the presenter object ID. Pass -AssigneeObjectId explicitly." }

$subscriptionId = (& az account show --query id -o tsv).Trim()
$resourceGroup = (& azd env get-value AZURE_RESOURCE_GROUP).Trim()
$accountName = (& azd env get-value FOUNDRY_ACCOUNT_NAME).Trim()
$projectName = (& azd env get-value FOUNDRY_PROJECT_NAME).Trim()
$projectScope = "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/Microsoft.CognitiveServices/accounts/$accountName/projects/$projectName"

& az role assignment create --assignee-object-id $AssigneeObjectId --role "53ca6127-db72-4b80-b1b0-d745d6d5456d" --scope $projectScope | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Unable to assign Foundry User at project scope." }
Write-Host "Foundry User assigned to $AssigneeObjectId at $projectScope"
