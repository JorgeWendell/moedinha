import type { Account, Category, Dashboard, Entry, Goal } from "@/src/domain/types";
import type { AccountKind, CategoryKind, EntryType, PaymentId } from "@/src/domain/presets";
import type { EmotionId } from "@/src/domain/emotions";

import { API_URL, authHeaders } from "./auth-client";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const sessionHeaders = await authHeaders();
  for (const [key, value] of Object.entries(sessionHeaders)) headers.set(key, value);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Não consegui falar com a API. Rode npm run api.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error || "Algo deu errado.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type EntryPayload = {
  type: EntryType;
  amountCents: number;
  title: string;
  note?: string | null;
  occurredOn: string;
  emotion: EmotionId;
  payment: PaymentId;
  categoryId?: string | null;
  bankAccountId: string;
};

export type AccountPayload = {
  name: string;
  institution?: string | null;
  emoji: string;
  color: string;
  kind: AccountKind;
  openingCents?: number;
};

export const api = {
  dashboard: (month: string) => request<Dashboard>(`/api/dashboard?month=${month}`),
  accounts: () => request<Account[]>("/api/accounts"),
  createAccount: (body: AccountPayload) =>
    request<Account>("/api/accounts", { method: "POST", body: JSON.stringify(body) }),
  updateAccount: (id: string, body: Omit<AccountPayload, "openingCents">) =>
    request<Account>(`/api/accounts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAccount: (id: string) => request(`/api/accounts/${id}`, { method: "DELETE" }),
  categories: () => request<Category[]>("/api/categories"),
  createCategory: (body: {
    name: string;
    emoji: string;
    emotion: EmotionId;
    color: string;
    kind: CategoryKind;
  }) => request<Category>("/api/categories", { method: "POST", body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request(`/api/categories/${id}`, { method: "DELETE" }),
  entries: (month: string, type = "all") =>
    request<Entry[]>(`/api/entries?month=${month}&type=${type}`),
  createEntry: (body: EntryPayload) =>
    request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(body) }),
  updateEntry: (id: string, body: EntryPayload) =>
    request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteEntry: (id: string) => request(`/api/entries/${id}`, { method: "DELETE" }),
  goals: () => request<Goal[]>("/api/goals"),
  createGoal: (body: {
    name: string;
    emoji: string;
    color: string;
    targetCents: number;
    deadline?: string | null;
  }) => request<Goal[]>("/api/goals", { method: "POST", body: JSON.stringify(body) }),
  deleteGoal: (id: string) => request(`/api/goals/${id}`, { method: "DELETE" }),
  deposit: (goalId: string, body: { amountCents: number; bankAccountId: string; occurredOn: string }) =>
    request(`/api/goals/${goalId}/deposits`, { method: "POST", body: JSON.stringify(body) }),
  deleteDeposit: (id: string) => request(`/api/deposits/${id}`, { method: "DELETE" }),
};
