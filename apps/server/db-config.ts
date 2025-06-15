import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_hQ0iDur3styM@ep-dry-feather-a2jmo76n.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

// Event listeners for pool
pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

// Shutdown handler
process.on("SIGINT", () => {
  pool.end().then(() => {
    console.log("Pool has ended");
    process.exit(0);
  });
});

export default pool;
