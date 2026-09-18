$ErrorActionPreference = "Stop"

function Get-AzdValue {
    param([string]$Name)
    $value = & azd env get-value $Name 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
        throw "azd output $Name is missing. Run the standard deployment first."
    }
    return $value.Trim()
}

$env:FOUNDRY_PROJECT_ENDPOINT = Get-AzdValue "FOUNDRY_PROJECT_ENDPOINT"
$env:FOUNDRY_ACCOUNT_ENDPOINT = Get-AzdValue "FOUNDRY_ACCOUNT_ENDPOINT"
$env:FOUNDRY_PROJECT_RESOURCE_ID = Get-AzdValue "FOUNDRY_PROJECT_RESOURCE_ID"
$env:SEARCH_SERVICE_ENDPOINT = Get-AzdValue "SEARCH_SERVICE_ENDPOINT"
$env:FOUNDRY_IQ_INDEX_NAME = Get-AzdValue "FOUNDRY_IQ_INDEX_NAME"
$env:FOUNDRY_IQ_SOURCE_NAME = Get-AzdValue "FOUNDRY_IQ_SOURCE_NAME"
$env:FOUNDRY_IQ_KNOWLEDGE_BASE_NAME = Get-AzdValue "FOUNDRY_IQ_KNOWLEDGE_BASE_NAME"
$env:FOUNDRY_IQ_CONNECTION_NAME = Get-AzdValue "FOUNDRY_IQ_CONNECTION_NAME"
$env:MODEL_ROUTER_DEPLOYMENT_NAME = Get-AzdValue "MODEL_ROUTER_DEPLOYMENT_NAME"

& npm run azure:portal-assets:apply
if ($LASTEXITCODE -ne 0) { throw "Portal demo asset setup failed." }
