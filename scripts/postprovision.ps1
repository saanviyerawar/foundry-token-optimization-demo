$ErrorActionPreference = "Stop"

function Get-AzdValue {
    param([string]$Name)
    $value = & azd env get-value $Name 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
        throw "azd output $Name is missing. Confirm provisioning completed successfully."
    }
    return $value.Trim()
}

$env:FOUNDRY_PROJECT_ENDPOINT = Get-AzdValue "FOUNDRY_PROJECT_ENDPOINT"
$env:FOUNDRY_AGENT_NAME = Get-AzdValue "FOUNDRY_AGENT_NAME"
$env:FOUNDRY_PROJECT_NAME = Get-AzdValue "FOUNDRY_PROJECT_NAME"
$env:MODEL_DEPLOYMENT_GPT_5_MINI = "gpt-5-mini"

Write-Host "Waiting briefly for Foundry RBAC propagation..."
Start-Sleep -Seconds 20

$created = $false
for ($attempt = 1; $attempt -le 4; $attempt++) {
    & npm run azure:agent
    if ($LASTEXITCODE -eq 0) {
        $created = $true
        break
    }
    if ($attempt -lt 4) {
        Write-Warning "Agent creation attempt $attempt failed; waiting for role propagation."
        Start-Sleep -Seconds (15 * $attempt)
    }
}

if (-not $created) {
    throw "Foundry resources deployed, but agent creation failed after retries. Run npm run azure:agent after RBAC propagation."
}

& $PSScriptRoot\export-azure-env.ps1
if ((Get-AzdValue "DEPLOY_PORTAL_DEMO_ASSETS") -eq "true") {
    & $PSScriptRoot\setup-portal-demo.ps1
}
Write-Host "Post-provision setup complete."
Write-Host "Open https://ai.azure.com, select project $env:FOUNDRY_PROJECT_NAME, and run $env:FOUNDRY_AGENT_NAME in the agent playground."
