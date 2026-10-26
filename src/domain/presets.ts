export const ENTRY_EMOJIS = [
  "🍔",
  "🍕",
  "🎉",
  "🏠",
  "🚌",
  "💊",
  "📚",
  "🎁",
  "☕",
  "💸",
  "🎮",
  "🐶",
  "✈️",
  "🛒",
  "💡",
  "👕",
  "💅",
  "🎵",
  "⚽",
  "💼",
  "✨",
  "📈",
];

export const ACCOUNT_EMOJIS = ["🏦", "👛", "💳", "🪙", "🐷", "💎", "📱", "🏛️"];

export const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "🎓", "💍", "🌴", "🐶", "🎁", "🛡️", "📈"];

export const ACCOUNT_COLORS = ["#FF8A3D", "#FF5D73", "#14B887", "#3AA0FF", "#6E56CF", "#F2C14E", "#2B2142"];

export const PAYMENTS = [
  { id: "pix", label: "Pix", emoji: "⚡" },
  { id: "debit", label: "Débito", emoji: "💳" },
  { id: "credit", label: "Crédito", emoji: "🌈" },
  { id: "cash", label: "Dinheiro", emoji: "💵" },
] as const;

export type PaymentId = (typeof PAYMENTS)[number]["id"];

export const ENTRY_TYPES = [
  { id: "income", label: "Receita", emoji: "🌱", hint: "entrou" },
  { id: "expense", label: "Despesa", emoji: "🎈", hint: "saiu" },
  { id: "investment", label: "Investir", emoji: "📈", hint: "futuro" },
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number]["id"];

export const CATEGORY_KINDS = [
  { id: "income", label: "Receita" },
  { id: "expense", label: "Despesa" },
  { id: "investment", label: "Investimento" },
  { id: "any", label: "Tudo" },
] as const;

export type CategoryKind = (typeof CATEGORY_KINDS)[number]["id"];

export const ACCOUNT_KINDS = [
  { id: "wallet", label: "Carteira" },
  { id: "checking", label: "Corrente" },
  { id: "savings", label: "Poupança" },
  { id: "investment", label: "Corretora" },
] as const;

export type AccountKind = (typeof ACCOUNT_KINDS)[number]["id"];
