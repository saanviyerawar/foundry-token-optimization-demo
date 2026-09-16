param([switch]$Force)

$ErrorActionPreference = "Stop"
if (-not $Force) {
    throw "Teardown deletes the azd resource group. Re-run with: npm run azure:down -- -Force"
}
& azd down --purge --force
if ($LASTEXITCODE -ne 0) { throw "azd down failed." }
