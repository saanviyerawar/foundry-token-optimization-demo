$ErrorActionPreference = "Stop"

function Set-DefaultAzdValue {
    param([string]$Name, [string]$Value)
    $current = & azd env get-value $Name 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($current)) {
        & azd env set $Name $Value | Out-Null
    }
}

Set-DefaultAzdValue "DEPLOY_WEB_APP" "false"
Set-DefaultAzdValue "ALLOW_API_KEY_AUTH" "false"
Set-DefaultAzdValue "CONNECT_APPLICATION_INSIGHTS" "true"
Set-DefaultAzdValue "DEPLOY_MODEL_ROUTER" "false"
Set-DefaultAzdValue "APP_SERVICE_SKU" "B1"
Set-DefaultAzdValue "MODEL_ROUTER_VERSION" "2025-11-18"
Set-DefaultAzdValue "MODEL_ROUTER_CAPACITY" "10"

$principalId = & azd env get-value AZURE_PRINCIPAL_ID 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($principalId)) {
    & azd env set AZURE_PRINCIPAL_ID "" | Out-Null
    Write-Warning "AZURE_PRINCIPAL_ID was not available. Infrastructure will deploy, but the signed-in presenter role assignment may require scripts/assign-presenter-role.ps1."
}

Write-Host "Pre-provision configuration is ready."
