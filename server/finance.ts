import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";

import type { EmotionId } from "../src/domain/emotions";
import { buildMood } from "../src/domain/mood";
import { monthRange } from "../src/domain/month";
import type {
  Account,
  Category,
  Dashboard,
  Entry,
  Goal,
  GoalDeposit,
} from "../src/domain/types";
import { bankAccounts, categories, entries, goalDeposits, goals } from "../src/db/schema";
import { db } from "./db";

function id() {
  return crypto.randomUUID();
}

function signedAmount(type: string, amountCents: number) {
  return type === "income" ? amountCents : -amountCents;
}

async function shiftBalance(
  executor: Pick<typeof db, "update">,
  accountId: string,
  delta: number,
) {
  await executor
    .update(bankAccounts)
    .set({
      balanceCents: sql`${bankAccounts.balanceCents} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, accountId));
}

const DEFAULT_CATEGORIES: Array<{
  name: string;
  emoji: string;
  emotion: EmotionId;
  color: string;
  kind: string;
}> = [
  { name: "Salário", emoji: "💼", emotion: "pride", color: "#14B887", kind: "income" },
  { name: "Freela", emoji: "✨", emotion: "joy", color: "#F2C14E", kind: "income" },
  { name: "Mercado", emoji: "🛒", emotion: "calm", color: "#3AA0FF", kind: "expense" },
  { name: "Delivery", emoji: "🍕", emotion: "guilt", color: "#FF5D73", kind: "expense" },
  { name: "Lazer", emoji: "🎉", emotion: "joy", color: "#FF8A3D", kind: "expense" },
  { name: "Casa", emoji: "🏠", emotion: "stress", color: "#6E56CF", kind: "expense" },
  { name: "Transporte", emoji: "🚌", emotion: "stress", color: "#2B2142", kind: "expense" },
  { name: "Cafezinho", emoji: "☕", emotion: "love", color: "#C47B4A", kind: "expense" },
  { name: "Saúde", emoji: "💪", emotion: "pride", color: "#14B887", kind: "expense" },
  { name: "Presentes", emoji: "🎁", emotion: "love", color: "#FF5D73", kind: "expense" },
  { name: "Estudos", emoji: "📚", emotion: "focus", color: "#3AA0FF", kind: "expense" },
  { name: "Aporte", emoji: "📈", emotion: "focus", color: "#6E56CF", kind: "investment" },
];

export async function seedUser(userId: string) {
  const now = new Date();
  await db.insert(bankAccounts).values({
    id: id(),
    userId,
    name: "Carteira",
    institution: "Dinheiro na mão",
    emoji: "👛",
    color: "#FF8A3D",
    kind: "wallet",
    balanceCents: 0,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      id: id(),
      userId,
      ...category,
      createdAt: now,
    })),
  );
}

function mapAccount(row: typeof bankAccounts.$inferSelect): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    emoji: row.emoji,
    color: row.color,
    kind: row.kind as Account["kind"],
    balanceCents: row.balanceCents,
  };
}

export async function listAccounts(userId: string) {
  const rows = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.userId, userId))
    .orderBy(asc(bankAccounts.createdAt));
  return rows.map(mapAccount);
}

export async function createAccount(
  userId: string,
  input: {
    name: string;
    institution?: string | null;
    emoji: string;
    color: string;
    kind: string;
    openingCents: number;
  },
) {
  const now = new Date();
  const row = {
    id: id(),
    userId,
    name: input.name,
    institution: input.institution || null,
    emoji: input.emoji,
    color: input.color,
    kind: input.kind,
    balanceCents: input.openingCents,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(bankAccounts).values(row);
  return mapAccount(row);
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: {
    name: string;
    institution?: string | null;
    emoji: string;
    color: string;
    kind: string;
  },
) {
  const [row] = await db
    .update(bankAccounts)
    .set({
      name: input.name,
      institution: input.institution || null,
      emoji: input.emoji,
      color: input.color,
      kind: input.kind,
      updatedAt: new Date(),
    })
    .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
    .returning();
  if (!row) throw new Error("Conta não encontrada.");
  return mapAccount(row);
}

export async function deleteAccount(userId: string, accountId: string) {
  const [usedEntry] = await db
    .select({ id: entries.id })
    .from(entries)
    .where(and(eq(entries.bankAccountId, accountId), eq(entries.userId, userId)))
    .limit(1);
  const [usedDeposit] = await db
    .select({ id: goalDeposits.id })
    .from(goalDeposits)
    .where(and(eq(goalDeposits.bankAccountId, accountId), eq(goalDeposits.userId, userId)))
    .limit(1);
  if (usedEntry || usedDeposit) {
    throw new Error("Essa conta já tem movimento. Apague os lançamentos antes.");
  }
  const result = await db
    .delete(bankAccounts)
    .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
    .returning({ id: bankAccounts.id });
  if (!result.length) throw new Error("Conta não encontrada.");
}

function mapCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    emotion: row.emotion as EmotionId,
    color: row.color,
    kind: row.kind as Category["kind"],
  };
}

export async function listCategories(userId: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt));
  return rows.map(mapCategory);
}

export async function createCategory(
  userId: string,
  input: { name: string; emoji: string; emotion: string; color: string; kind: string },
) {
  const row = {
    id: id(),
    userId,
    name: input.name,
    emoji: input.emoji,
    emotion: input.emotion,
    color: input.color,
    kind: input.kind,
    createdAt: new Date(),
  };
  await db.insert(categories).values(row);
  return mapCategory(row);
}

export async function deleteCategory(userId: string, categoryId: string) {
  const result = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning({ id: categories.id });
  if (!result.length) throw new Error("Categoria não encontrada.");
}

async function ownAccount(userId: string, accountId: string) {
  const [row] = await db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, accountId), eq(bankAccounts.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Conta não encontrada.");
  return row;
}

async function ownCategory(userId: string, categoryId: string | null | undefined) {
  if (!categoryId) return null;
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Categoria não encontrada.");
  return row;
}

type EntryInput = {
  type: string;
  amountCents: number;
  title: string;
  note?: string | null;
  occurredOn: string;
  emotion: string;
  payment: string;
  categoryId?: string | null;
  bankAccountId: string;
};

export async function createEntry(userId: string, input: EntryInput) {
  await ownAccount(userId, input.bankAccountId);
  await ownCategory(userId, input.categoryId);
  const row = {
    id: id(),
    userId,
    type: input.type,
    amountCents: input.amountCents,
    title: input.title,
    note: input.note || null,
    occurredOn: input.occurredOn,
    emotion: input.emotion,
    payment: input.payment,
    categoryId: input.categoryId || null,
    bankAccountId: input.bankAccountId,
    createdAt: new Date(),
  };

  await db.transaction(async (tx) => {
    await tx.insert(entries).values(row);
    await shiftBalance(tx, input.bankAccountId, signedAmount(input.type, input.amountCents));
  });

  return getEntry(userId, row.id);
}

export async function updateEntry(userId: string, entryId: string, input: EntryInput) {
  const current = await getEntry(userId, entryId);
  await ownAccount(userId, input.bankAccountId);
  await ownCategory(userId, input.categoryId);

  await db.transaction(async (tx) => {
    await shiftBalance(tx, current.bankAccountId, -signedAmount(current.type, current.amountCents));
    await shiftBalance(tx, input.bankAccountId, signedAmount(input.type, input.amountCents));
    await tx
      .update(entries)
      .set({
        type: input.type,
        amountCents: input.amountCents,
        title: input.title,
        note: input.note || null,
        occurredOn: input.occurredOn,
        emotion: input.emotion,
        payment: input.payment,
        categoryId: input.categoryId || null,
        bankAccountId: input.bankAccountId,
      })
      .where(and(eq(entries.id, entryId), eq(entries.userId, userId)));
  });

  return getEntry(userId, entryId);
}

export async function deleteEntry(userId: string, entryId: string) {
  const current = await getEntry(userId, entryId);
  await db.transaction(async (tx) => {
    await shiftBalance(tx, current.bankAccountId, -signedAmount(current.type, current.amountCents));
    await tx.delete(entries).where(and(eq(entries.id, entryId), eq(entries.userId, userId)));
  });
}

function mapEntry(row: {
  entry: typeof entries.$inferSelect;
  categoryName: string | null;
  categoryEmoji: string | null;
  accountName: string;
  accountEmoji: string;
}): Entry {
  return {
    id: row.entry.id,
    type: row.entry.type as Entry["type"],
    amountCents: row.entry.amountCents,
    title: row.entry.title,
    note: row.entry.note,
    occurredOn: row.entry.occurredOn,
    emotion: row.entry.emotion as EmotionId,
    payment: row.entry.payment as Entry["payment"],
    categoryId: row.entry.categoryId,
    categoryName: row.categoryName,
    categoryEmoji: row.categoryEmoji,
    bankAccountId: row.entry.bankAccountId,
    accountName: row.accountName,
    accountEmoji: row.accountEmoji,
  };
}

const entrySelection = {
  entry: entries,
  categoryName: categories.name,
  categoryEmoji: categories.emoji,
  accountName: bankAccounts.name,
  accountEmoji: bankAccounts.emoji,
};

export async function getEntry(userId: string, entryId: string) {
  const [row] = await db
    .select(entrySelection)
    .from(entries)
    .leftJoin(categories, eq(entries.categoryId, categories.id))
    .innerJoin(bankAccounts, eq(entries.bankAccountId, bankAccounts.id))
    .where(and(eq(entries.id, entryId), eq(entries.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Lançamento não encontrado.");
  return mapEntry(row);
}

export async function listEntries(userId: string, month: string, type?: string) {
  const { start, end } = monthRange(month);
  const filters = [
    eq(entries.userId, userId),
    gte(entries.occurredOn, start),
    lt(entries.occurredOn, end),
  ];
  if (type && type !== "all") filters.push(eq(entries.type, type));

  const rows = await db
    .select(entrySelection)
    .from(entries)
    .leftJoin(categories, eq(entries.categoryId, categories.id))
    .innerJoin(bankAccounts, eq(entries.bankAccountId, bankAccounts.id))
    .where(and(...filters))
    .orderBy(desc(entries.occurredOn), desc(entries.createdAt));
  return rows.map(mapEntry);
}

export async function getDashboard(userId: string, month: string): Promise<Dashboard> {
  const monthEntries = await listEntries(userId, month);
  const { start, end } = monthRange(month);
  const deposits = await db
    .select()
    .from(goalDeposits)
    .where(
      and(
        eq(goalDeposits.userId, userId),
        gte(goalDeposits.occurredOn, start),
        lt(goalDeposits.occurredOn, end),
      ),
    );
  const accounts = await listAccounts(userId);

  const incomeCents = sum(monthEntries.filter((entry) => entry.type === "income"));
  const expenseCents = sum(monthEntries.filter((entry) => entry.type === "expense"));
  const investmentCents = sum(monthEntries.filter((entry) => entry.type === "investment"));
  const savedCents = deposits.reduce((total, deposit) => total + deposit.amountCents, 0);
  const leftCents = incomeCents - expenseCents - investmentCents - savedCents;

  const emotionMap = new Map<EmotionId, number>();
  const categoryMap = new Map<string, Dashboard["categories"][number]>();
  for (const entry of monthEntries.filter((item) => item.type !== "income")) {
    emotionMap.set(entry.emotion, (emotionMap.get(entry.emotion) ?? 0) + entry.amountCents);
    if (!entry.categoryId) continue;
    const current = categoryMap.get(entry.categoryId) ?? {
      id: entry.categoryId,
      name: entry.categoryName ?? "Sem categoria",
      emoji: entry.categoryEmoji ?? "✨",
      emotion: entry.emotion,
      cents: 0,
    };
    current.cents += entry.amountCents;
    categoryMap.set(entry.categoryId, current);
  }

  const emotions = [...emotionMap.entries()]
    .map(([emotion, cents]) => ({ emotion, cents }))
    .sort((a, b) => b.cents - a.cents);
  const categoryBreakdown = [...categoryMap.values()].sort((a, b) => b.cents - a.cents);

  return {
    month,
    incomeCents,
    expenseCents,
    investmentCents,
    savedCents,
    leftCents,
    accountsTotalCents: accounts.reduce((total, account) => total + account.balanceCents, 0),
    mood: buildMood({
      incomeCents,
      expenseCents,
      investmentCents,
      savedCents,
      emotions,
    }),
    emotions,
    categories: categoryBreakdown,
    recent: monthEntries.slice(0, 6),
  };
}

function sum(rows: Entry[]) {
  return rows.reduce((total, entry) => total + entry.amountCents, 0);
}

export async function listGoals(userId: string): Promise<Goal[]> {
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
  const depositRows = await db
    .select({
      deposit: goalDeposits,
      accountName: bankAccounts.name,
      accountEmoji: bankAccounts.emoji,
    })
    .from(goalDeposits)
    .innerJoin(bankAccounts, eq(goalDeposits.bankAccountId, bankAccounts.id))
    .where(eq(goalDeposits.userId, userId))
    .orderBy(desc(goalDeposits.occurredOn));

  return goalRows.map((goal) => ({
    id: goal.id,
    name: goal.name,
    emoji: goal.emoji,
    color: goal.color,
    targetCents: goal.targetCents,
    savedCents: goal.savedCents,
    deadline: goal.deadline,
    deposits: depositRows
      .filter((row) => row.deposit.goalId === goal.id)
      .map(
        (row): GoalDeposit => ({
          id: row.deposit.id,
          amountCents: row.deposit.amountCents,
          occurredOn: row.deposit.occurredOn,
          bankAccountId: row.deposit.bankAccountId,
          accountName: row.accountName,
          accountEmoji: row.accountEmoji,
        }),
      ),
  }));
}

export async function createGoal(
  userId: string,
  input: { name: string; emoji: string; color: string; targetCents: number; deadline?: string | null },
) {
  await db.insert(goals).values({
    id: id(),
    userId,
    name: input.name,
    emoji: input.emoji,
    color: input.color,
    targetCents: input.targetCents,
    savedCents: 0,
    deadline: input.deadline || null,
    createdAt: new Date(),
  });
  return listGoals(userId);
}

export async function addDeposit(
  userId: string,
  goalId: string,
  input: { amountCents: number; bankAccountId: string; occurredOn: string },
) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!goal) throw new Error("Meta não encontrada.");
  await ownAccount(userId, input.bankAccountId);

  await db.transaction(async (tx) => {
    await tx.insert(goalDeposits).values({
      id: id(),
      userId,
      goalId,
      bankAccountId: input.bankAccountId,
      amountCents: input.amountCents,
      occurredOn: input.occurredOn,
      createdAt: new Date(),
    });
    await tx
      .update(goals)
      .set({ savedCents: sql`${goals.savedCents} + ${input.amountCents}` })
      .where(eq(goals.id, goalId));
    await shiftBalance(tx, input.bankAccountId, -input.amountCents);
  });
}

export async function deleteDeposit(userId: string, depositId: string) {
  const [row] = await db
    .select()
    .from(goalDeposits)
    .where(and(eq(goalDeposits.id, depositId), eq(goalDeposits.userId, userId)))
    .limit(1);
  if (!row) throw new Error("Aporte da meta não encontrado.");

  await db.transaction(async (tx) => {
    await shiftBalance(tx, row.bankAccountId, row.amountCents);
    await tx
      .update(goals)
      .set({ savedCents: sql`${goals.savedCents} - ${row.amountCents}` })
      .where(eq(goals.id, row.goalId));
    await tx.delete(goalDeposits).where(eq(goalDeposits.id, depositId));
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  const deposits = await db
    .select()
    .from(goalDeposits)
    .where(and(eq(goalDeposits.goalId, goalId), eq(goalDeposits.userId, userId)));
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!goal) throw new Error("Meta não encontrada.");

  await db.transaction(async (tx) => {
    for (const deposit of deposits) {
      await shiftBalance(tx, deposit.bankAccountId, deposit.amountCents);
    }
    await tx.delete(goals).where(eq(goals.id, goalId));
  });
}
