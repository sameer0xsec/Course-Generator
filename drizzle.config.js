import { config } from "dotenv";
config({ path: ".env.local" });
config();

/** @type {import("drizzle-kit").Config} */
export default {
  dialect: "postgresql",
  schema: "./configs/schema.jsx",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
