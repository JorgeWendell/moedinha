import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";

import * as schema from "../src/db/schema";
import { db } from "./db";
import { seedUser } from "./finance";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3333";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [expo(), bearer()],
  trustedOrigins: [
    baseURL,
    "https://moedinha.adelweb.br",
    "financecontrol://",
    "exp://",
    "exp://**",
    "exp://192.168.*.*:*/**",
    "http://localhost:*",
    "http://127.0.0.1:*",
  ],
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          await seedUser(created.id);
        },
      },
    },
  },
});
