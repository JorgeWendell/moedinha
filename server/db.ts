import fs from "node:fs";

import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "../src/db/schema";

fs.mkdirSync("./data", { recursive: true });

export const db = drizzle("./data/moedinha", { schema });

export async function migrateDb() {
  await migrate(db, { migrationsFolder: "./drizzle" });
}
