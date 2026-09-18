param(
    [string]$EnvironmentName = "demo",
    [string]$Location = "eastus2",
    [string]$SubscriptionId = "",
    [switch]$DeployModelRouter,
    [switch]$DeployCompanionApp,
    [switch]$SkipWebApp,
    [switch]$AllowApiKeyAuth
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command azd -ErrorAction SilentlyContinue)) { throw "Azure Developer CLI (azd) is required." }
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw "Azure CLI (az) is required." }
if ($DeployCompanionApp.IsPresent -and $SkipWebApp.IsPresent) {
    throw "Choose either -DeployCompanionApp or -SkipWebApp, not both."
}

function Get-ActiveAzureAccount {
    $accountJson = & az account show --output json 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($accountJson -join ""))) {
        throw "Azure CLI authentication is required. Run az login and select the intended subscription."
    }
    return ($accountJson -join [Environment]::NewLine) | ConvertFrom-Json
}

function Test-AzurePermission {
    param(
        [object[]]$Permissions,
        [string]$Action
    )

    foreach ($permission in $Permissions) {
        $allowed = @($permission.actions) | Where-Object { $Action -like $_ }
        $denied = @($permission.notActions) | Where-Object { $Action -like $_ }
        if ($allowed.Count -gt 0 -and $denied.Count -eq 0) {
            return $true
        }
    }
    return $false
}

Write-Warning "This deployment creates billable Azure resources and model capacity. Review infra/main.bicep and regional quota before continuing."

$account = Get-ActiveAzureAccount
if ($SubscriptionId) {
    & az account set --subscription $SubscriptionId
    if ($LASTEXITCODE -ne 0) { throw "Unable to select Azure subscription $SubscriptionId." }
    $account = Get-ActiveAzureAccount
}

$resolvedSubscriptionId = $account.id
Write-Host "Azure target: $($account.name) ($resolvedSubscriptionId), tenant $($account.tenantId), identity $($account.user.name)"

& azd auth login --tenant-id $account.tenantId
if ($LASTEXITCODE -ne 0) { throw "azd authentication failed." }

& azd env select $EnvironmentName --no-prompt 2>$null
if ($LASTEXITCODE -ne 0) {
    $newArgs = @("env", "new", $EnvironmentName, "--location", $Location, "--subscription", $resolvedSubscriptionId)
    & azd @newArgs
    if ($LASTEXITCODE -ne 0) { throw "Unable to create azd environment $EnvironmentName." }
}

& azd env set AZURE_SUBSCRIPTION_ID $resolvedSubscriptionId | Out-Null
& azd env set AZURE_LOCATION $Location | Out-Null
& azd env set DEPLOY_MODEL_ROUTER ($DeployModelRouter.IsPresent.ToString().ToLowerInvariant()) | Out-Null
& azd env set DEPLOY_WEB_APP ($DeployCompanionApp.IsPresent.ToString().ToLowerInvariant()) | Out-Null
& azd env set ALLOW_API_KEY_AUTH ($AllowApiKeyAuth.IsPresent.ToString().ToLowerInvariant()) | Out-Null

$permissionsJson = & az rest --method get --url "https://management.azure.com/subscriptions/$resolvedSubscriptionId/providers/Microsoft.Authorization/permissions?api-version=2022-04-01" --output json 2>$null
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($permissionsJson -join ""))) {
    $permissions = (($permissionsJson -join [Environment]::NewLine) | ConvertFrom-Json).value
    $requiredActions = @(
        "Microsoft.Resources/deployments/validate/action",
        "Microsoft.Authorization/roleAssignments/write"
    )
    $missingActions = @($requiredActions | Where-Object { -not (Test-AzurePermission -Permissions $permissions -Action $_) })
    if ($missingActions.Count -gt 0) {
        throw "The active identity lacks required subscription permissions: $($missingActions -join ', '). Use Owner, or Contributor plus Role Based Access Control Administrator."
    }
} else {
    Write-Warning "Unable to preflight effective Azure permissions; deployment validation will perform the authoritative check."
}

if ($DeployCompanionApp.IsPresent) {
    & azd up
    if ($LASTEXITCODE -ne 0) { throw "azd up failed." }
} else {
    & azd provision
    if ($LASTEXITCODE -ne 0) { throw "azd provision failed." }
}

Write-Host ""
Write-Host "Foundry demo deployment complete."
Write-Host "Open https://ai.azure.com and select the project named:"
& azd env get-value FOUNDRY_PROJECT_NAME
Write-Host "Then open foundry-optimization-agent in the agent playground."
if ($DeployCompanionApp.IsPresent) {
    Write-Host "The optional companion app URI is:"
    & azd env get-value AZURE_WEB_APP_URI
}
