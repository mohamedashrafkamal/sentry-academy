import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_hQ0iDur3styM@ep-dry-feather-a2jmo76n.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  },
} satisfies Config;
