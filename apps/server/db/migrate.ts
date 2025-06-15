import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl =
  "postgresql://neondb_owner:npg_hQ0iDur3styM@ep-dry-feather-a2jmo76n.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const runMigrations = async () => {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in .env file");
  }
  const connectionString = databaseUrl;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
