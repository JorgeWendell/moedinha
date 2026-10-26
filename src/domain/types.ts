import type { EmotionId } from "./emotions";
import type { Mood } from "./mood";
import type { AccountKind, CategoryKind, EntryType, PaymentId } from "./presets";

export type Account = {
  id: string;
  name: string;
  institution: string | null;
  emoji: string;
  color: string;
  kind: AccountKind;
  balanceCents: number;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  emotion: EmotionId;
  color: string;
  kind: CategoryKind;
};

export type Entry = {
  id: string;
  type: EntryType;
  amountCents: number;
  title: string;
  note: string | null;
  occurredOn: string;
  emotion: EmotionId;
  payment: PaymentId;
  categoryId: string | null;
  categoryName: string | null;
  categoryEmoji: string | null;
  bankAccountId: string;
  accountName: string;
  accountEmoji: string;
};

export type GoalDeposit = {
  id: string;
  amountCents: number;
  occurredOn: string;
  bankAccountId: string;
  accountName: string;
  accountEmoji: string;
};

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetCents: number;
  savedCents: number;
  deadline: string | null;
  deposits: GoalDeposit[];
};

export type Dashboard = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
  savedCents: number;
  leftCents: number;
  accountsTotalCents: number;
  mood: Mood;
  emotions: { emotion: EmotionId; cents: number }[];
  categories: {
    id: string;
    name: string;
    emoji: string;
    emotion: EmotionId;
    cents: number;
  }[];
  recent: Entry[];
};
