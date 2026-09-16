param(
    [string]$EnvironmentName = "demo",
    [string]$Location = "eastus2",
    [string]$SubscriptionId = "",
    [switch]$DeployModelRouter,
    [switch]$SkipWebApp,
    [switch]$AllowApiKeyAuth
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command azd -ErrorAction SilentlyContinue)) { throw "Azure Developer CLI (azd) is required." }
if (-not (Get-Command az -ErrorAction SilentlyContinue)) { throw "Azure CLI is required for post-deploy App Service configuration and optional model-router fallback." }

Write-Warning "This deployment creates billable Azure resources and model capacity. Review infra/main.bicep and regional quota before continuing."

& azd auth login
if ($LASTEXITCODE -ne 0) { throw "azd authentication failed." }

& azd env select $EnvironmentName --no-prompt 2>$null
if ($LASTEXITCODE -ne 0) {
    $newArgs = @("env", "new", $EnvironmentName, "--location", $Location)
    if ($SubscriptionId) { $newArgs += @("--subscription", $SubscriptionId) }
    & azd @newArgs
    if ($LASTEXITCODE -ne 0) { throw "Unable to create azd environment $EnvironmentName." }
}

& azd env set AZURE_LOCATION $Location | Out-Null
& azd env set DEPLOY_MODEL_ROUTER ($DeployModelRouter.IsPresent.ToString().ToLowerInvariant()) | Out-Null
& azd env set DEPLOY_WEB_APP ((-not $SkipWebApp.IsPresent).ToString().ToLowerInvariant()) | Out-Null
& azd env set ALLOW_API_KEY_AUTH ($AllowApiKeyAuth.IsPresent.ToString().ToLowerInvariant()) | Out-Null

& azd up
if ($LASTEXITCODE -ne 0) { throw "azd up failed." }

Write-Host "Deployment complete. Run npm run azure:env, then use .env.azure.local for local real mode."
