import { promises as fs } from "fs";
import path from "path";
import type { AppData } from "./types";
import { buildSeedData } from "./seed-data";

const dataDirectory = process.env.DATA_DIRECTORY
  ? path.resolve(process.env.DATA_DIRECTORY)
  : path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "app-data.json");
let writeQueue = Promise.resolve();

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppData>;
  return Array.isArray(candidate.requests)
    && Array.isArray(candidate.traces)
    && Array.isArray(candidate.knowledge)
    && Array.isArray(candidate.evaluations);
}

export async function ensureData(): Promise<void> {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await writeData(buildSeedData());
  }
}

export async function readData(): Promise<AppData> {
  await ensureData();
  const parsed: unknown = JSON.parse(await fs.readFile(dataFile, "utf8"));
  if (!isAppData(parsed)) throw new Error("Persistent data is invalid. Run npm run reset.");
  return parsed;
}

export async function writeData(data: AppData): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(dataDirectory, { recursive: true });
    const temporary = path.join(dataDirectory, `.app-data-${process.pid}-${Date.now()}.tmp`);
    await fs.writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await fs.rename(temporary, dataFile);
  });
  return writeQueue;
}

export async function updateData(mutator: (data: AppData) => AppData | void): Promise<AppData> {
  const current = await readData();
  const updated = mutator(current) ?? current;
  await writeData(updated);
  return updated;
}

export async function resetData(): Promise<AppData> {
  const seeded = buildSeedData();
  await writeData(seeded);
  return seeded;
}
