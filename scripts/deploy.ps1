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
if ($DeployCompanionApp.IsPresent -and $SkipWebApp.IsPresent) {
    throw "Choose either -DeployCompanionApp or -SkipWebApp, not both."
}

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
& azd env set DEPLOY_WEB_APP ($DeployCompanionApp.IsPresent.ToString().ToLowerInvariant()) | Out-Null
& azd env set ALLOW_API_KEY_AUTH ($AllowApiKeyAuth.IsPresent.ToString().ToLowerInvariant()) | Out-Null

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
