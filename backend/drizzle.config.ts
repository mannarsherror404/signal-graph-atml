import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const backendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  out: resolve(backendRoot, "drizzle"),
  schema: resolve(backendRoot, "db/schema.ts"),
  dialect: "sqlite",
});
