import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { z } from "zod";

import { EMOTION_IDS } from "../src/domain/emotions";
import { currentMonth } from "../src/domain/month";
import { auth } from "./auth";
import { migrateDb } from "./db";
import {
  addDeposit,
  createAccount,
  createCategory,
  createEntry,
  createGoal,
  deleteAccount,
  deleteCategory,
  deleteDeposit,
  deleteEntry,
  deleteGoal,
  getDashboard,
  listAccounts,
  listCategories,
  listEntries,
  listGoals,
  updateAccount,
  updateEntry,
} from "./finance";

const app = express();
const port = Number(process.env.PORT || 3333);

app.set("trust proxy", true);
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "expo-origin"],
    exposedHeaders: ["set-auth-token"],
  }),
);

app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

const entrySchema = z.object({
  type: z.enum(["income", "expense", "investment"]),
  amountCents: z.number().int().positive("O valor precisa ser maior que zero."),
  title: z.string().trim().min(1, "Dá um nome para esse lançamento.").max(80),
  note: z.string().trim().max(200).nullable().optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  emotion: z.enum(EMOTION_IDS),
  payment: z.enum(["pix", "debit", "credit", "cash"]),
  categoryId: z.string().min(1).nullable().optional(),
  bankAccountId: z.string().min(1, "Escolhe uma conta."),
});

const accountSchema = z.object({
  name: z.string().trim().min(1, "A conta precisa de um nome.").max(40),
  institution: z.string().trim().max(40).nullable().optional(),
  emoji: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  kind: z.enum(["wallet", "checking", "savings", "investment"]),
  openingCents: z.number().int().min(0).optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(1, "A categoria precisa de um nome.").max(32),
  emoji: z.string().trim().min(1).max(8),
  emotion: z.enum(EMOTION_IDS),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  kind: z.enum(["income", "expense", "investment", "any"]),
});

const goalSchema = z.object({
  name: z.string().trim().min(1, "A meta precisa de um nome.").max(40),
  emoji: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  targetCents: z.number().int().positive("A meta precisa de um valor."),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const depositSchema = z.object({
  amountCents: z.number().int().positive("Quanto você vai guardar?"),
  bankAccountId: z.string().min(1, "Escolhe de qual conta sai."),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function readBody<T>(schema: z.ZodType<T>, body: unknown, res: express.Response) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    res.status(400).json({ error: message });
    return null;
  }
  return parsed.data;
}

function sessionHeaders(req: express.Request) {
  const headers = fromNodeHeaders(req.headers);
  const authorization = headers.get("authorization");
  const cookie = headers.get("cookie") ?? "";
  if (authorization?.toLowerCase().startsWith("bearer ") && !cookie.includes("session_token")) {
    const token = authorization.slice(7).trim();
    headers.set("cookie", cookie ? `${cookie}; better-auth.session_token=${token}` : `better-auth.session_token=${token}`);
  }
  return headers;
}

async function requireUser(req: express.Request, res: express.Response) {
  const session = await auth.api.getSession({
    headers: sessionHeaders(req),
  });
  if (!session) {
    res.status(401).json({ error: "Sua sessão expirou. Entra de novo." });
    return null;
  }
  return session.user;
}

function fail(res: express.Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Algo deu errado.";
  res.status(400).json({ error: message });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/dashboard", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const month = typeof req.query.month === "string" ? req.query.month : currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "Mês inválido." });
    return;
  }
  res.json(await getDashboard(user.id, month));
});

app.get("/api/accounts", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(await listAccounts(user.id));
});

app.post("/api/accounts", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(accountSchema, req.body, res);
  if (!body) return;
  try {
    res.status(201).json(await createAccount(user.id, { ...body, openingCents: body.openingCents ?? 0 }));
  } catch (error) {
    fail(res, error);
  }
});

app.patch("/api/accounts/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(accountSchema.omit({ openingCents: true }), req.body, res);
  if (!body) return;
  try {
    res.json(await updateAccount(user.id, req.params.id, body));
  } catch (error) {
    fail(res, error);
  }
});

app.delete("/api/accounts/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    await deleteAccount(user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

app.get("/api/categories", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(await listCategories(user.id));
});

app.post("/api/categories", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(categorySchema, req.body, res);
  if (!body) return;
  res.status(201).json(await createCategory(user.id, body));
});

app.delete("/api/categories/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    await deleteCategory(user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

app.get("/api/entries", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const month = typeof req.query.month === "string" ? req.query.month : currentMonth();
  const type = typeof req.query.type === "string" ? req.query.type : "all";
  res.json(await listEntries(user.id, month, type));
});

app.post("/api/entries", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(entrySchema, req.body, res);
  if (!body) return;
  try {
    res.status(201).json(await createEntry(user.id, body));
  } catch (error) {
    fail(res, error);
  }
});

app.put("/api/entries/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(entrySchema, req.body, res);
  if (!body) return;
  try {
    res.json(await updateEntry(user.id, req.params.id, body));
  } catch (error) {
    fail(res, error);
  }
});

app.delete("/api/entries/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    await deleteEntry(user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

app.get("/api/goals", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json(await listGoals(user.id));
});

app.post("/api/goals", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(goalSchema, req.body, res);
  if (!body) return;
  res.status(201).json(await createGoal(user.id, body));
});

app.delete("/api/goals/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    await deleteGoal(user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

app.post("/api/goals/:id/deposits", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const body = readBody(depositSchema, req.body, res);
  if (!body) return;
  try {
    await addDeposit(user.id, req.params.id, body);
    res.status(201).json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

app.delete("/api/deposits/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    await deleteDeposit(user.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    fail(res, error);
  }
});

const webDir = path.resolve(process.env.WEB_DIR || "dist");
const webIndex = path.join(webDir, "index.html");
if (fs.existsSync(webIndex)) {
  app.use(express.static(webDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path === "/health") return next();
    res.sendFile(webIndex);
  });
}

async function main() {
  await migrateDb();
  app.listen(port, "0.0.0.0", () => {
    const publicUrl = process.env.BETTER_AUTH_URL || `http://localhost:${port}`;
    console.log(`Moedinha em ${publicUrl}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
