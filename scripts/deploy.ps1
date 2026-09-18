param(
    [string]$EnvironmentName = "demo",
    [string]$Location = "eastus2",
    [string]$SearchLocation = "",
    [string]$SubscriptionId = "",
    [string]$PrincipalId = "",
    [switch]$DeployModelRouter,
    [switch]$SkipPortalDemoAssets,
    [switch]$AllowApiKeyAuth
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command azd -ErrorAction SilentlyContinue)) { throw "Azure Developer CLI (azd) is required." }
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw "Azure CLI (az) is required." }
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
& azd env set SEARCH_LOCATION $(if ($SearchLocation) { $SearchLocation } else { $Location }) | Out-Null
$deployPortalAssets = -not $SkipPortalDemoAssets.IsPresent
$deployRouter = $DeployModelRouter.IsPresent -or $deployPortalAssets
& azd env set DEPLOY_MODEL_ROUTER ($deployRouter.ToString().ToLowerInvariant()) | Out-Null
& azd env set DEPLOY_FOUNDRY_IQ ($deployPortalAssets.ToString().ToLowerInvariant()) | Out-Null
& azd env set DEPLOY_PORTAL_DEMO_ASSETS ($deployPortalAssets.ToString().ToLowerInvariant()) | Out-Null
& azd env set ALLOW_API_KEY_AUTH ($AllowApiKeyAuth.IsPresent.ToString().ToLowerInvariant()) | Out-Null

$principalId = $PrincipalId.Trim()
if (-not $principalId) {
    $savedPrincipalId = (& azd env get-value AZURE_PRINCIPAL_ID 2>$null)
    if ($LASTEXITCODE -eq 0) {
        $principalId = (($savedPrincipalId | Where-Object { $_ }) -join "").Trim()
    }
}
if (-not $principalId -and $account.user.type -eq "user") {
    $resolvedPrincipalId = (& az ad signed-in-user show --query id --output tsv 2>$null)
    if ($LASTEXITCODE -eq 0 -and $resolvedPrincipalId) {
        $principalId = (($resolvedPrincipalId | Where-Object { $_ }) -join "").Trim()
    }
} elseif (-not $principalId -and $account.user.type -eq "servicePrincipal") {
    $resolvedPrincipalId = (& az ad sp show --id $account.user.name --query id --output tsv 2>$null)
    if ($LASTEXITCODE -eq 0 -and $resolvedPrincipalId) {
        $principalId = (($resolvedPrincipalId | Where-Object { $_ }) -join "").Trim()
    }
}
if ($principalId) {
    & azd env set AZURE_PRINCIPAL_ID $principalId | Out-Null
} elseif ($deployPortalAssets) {
    throw "Unable to resolve the deploying identity object ID required for Foundry IQ data-plane roles."
}

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

& azd provision
if ($LASTEXITCODE -ne 0) { throw "azd provision failed." }

Write-Host ""
Write-Host "Foundry demo deployment complete."
Write-Host "Open https://ai.azure.com and select the project named:"
& azd env get-value FOUNDRY_PROJECT_NAME
if ($deployPortalAssets) {
    Write-Host "Then open youtube-router-agent and the seeded Evaluations, Toolboxes, Knowledge, and Tracing views."
} else {
    Write-Host "Then open foundry-optimization-agent in the agent playground."
}
