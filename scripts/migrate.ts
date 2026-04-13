import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

setDefaultResultOrder("ipv4first");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  console.log("Applying migrations...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
