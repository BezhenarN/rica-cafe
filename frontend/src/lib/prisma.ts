import { PrismaClient } from "@prisma/client";

// Create a new PrismaClient for each invocation (serverless cold start).
// The DATABASE_URL is read from the runtime environment on construction.
// This ensures we always pick up the latest env vars from Vercel.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
