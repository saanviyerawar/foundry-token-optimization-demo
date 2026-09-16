let initialization: Promise<void> | undefined;

export async function ensureAzureMonitor(): Promise<void> {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return;
  initialization ??= import("@azure/monitor-opentelemetry").then(({ useAzureMonitor }) => {
    useAzureMonitor({
      azureMonitorExporterOptions: { connectionString },
    });
  });
  await initialization;
}
