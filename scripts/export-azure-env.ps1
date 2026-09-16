$ErrorActionPreference = "Stop"

function Get-OptionalAzdValue {
    param([string]$Name)
    $value = & azd env get-value $Name 2>$null
    if ($LASTEXITCODE -ne 0) { return "" }
    return $value.Trim()
}

$projectEndpoint = Get-OptionalAzdValue "FOUNDRY_PROJECT_ENDPOINT"
if ([string]::IsNullOrWhiteSpace($projectEndpoint)) {
    throw "FOUNDRY_PROJECT_ENDPOINT is missing. Run azd provision or azd up first."
}

$lines = @(
    "AI_PROVIDER=foundry",
    "FOUNDRY_PROJECT_ENDPOINT=$projectEndpoint",
    "FOUNDRY_AGENT_NAME=$(Get-OptionalAzdValue 'FOUNDRY_AGENT_NAME')",
    "FOUNDRY_USE_AGENT=false",
    "AZURE_WEB_APP_URI=$(Get-OptionalAzdValue 'AZURE_WEB_APP_URI')",
    "MODEL_DEPLOYMENT_GPT_5_NANO=gpt-5-nano",
    "MODEL_DEPLOYMENT_GPT_5_MINI=gpt-5-mini",
    "MODEL_DEPLOYMENT_GPT_4_1_MINI=gpt-4-1-mini",
    "MODEL_DEPLOYMENT_CLAUDE_OPUS_5=gpt-5-mini",
    "MODEL_ROUTER_DEPLOYMENT_NAME=$(Get-OptionalAzdValue 'MODEL_ROUTER_DEPLOYMENT_NAME')"
)

$target = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
$lines | Set-Content -Path $target -Encoding utf8
Write-Host "Wrote non-secret runtime settings to $target"
