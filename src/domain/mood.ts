import { emotionById, type EmotionId } from "./emotions";

export type Mood = {
  emoji: string;
  title: string;
  message: string;
};

type MoodInput = {
  incomeCents: number;
  expenseCents: number;
  investmentCents: number;
  savedCents: number;
  emotions: { emotion: EmotionId; cents: number }[];
};

export function buildMood(input: MoodInput): Mood {
  const left =
    input.incomeCents -
    input.expenseCents -
    input.investmentCents -
    input.savedCents;
  const spent = input.expenseCents + input.investmentCents + input.savedCents;
  const dominant = [...input.emotions].sort((a, b) => b.cents - a.cents)[0];
  const feeling = dominant ? emotionById(dominant.emotion) : null;

  if (input.incomeCents === 0 && spent === 0) {
    return {
      emoji: "🪙",
      title: "Mês em branco",
      message: "Nada lançado ainda. Bora contar a primeira moedinha?",
    };
  }

  if (left < 0) {
    return {
      emoji: "😬",
      title: "Mês apertado",
      message:
        "Saiu mais do que entrou. Sem bronca: a Moedinha só está apontando o buraco.",
    };
  }

  if (input.investmentCents > input.expenseCents && input.investmentCents > 0) {
    return {
      emoji: "😎",
      title: "Mês investidor",
      message: "Foi mais grana para o futuro do que para o gasto. Isso rende orgulho.",
    };
  }

  if (feeling?.id === "joy" || feeling?.id === "love") {
    return {
      emoji: "🤩",
      title: "Mês gostoso",
      message: "O dinheiro saiu sorrindo. Só vê se a alegria ainda cabe no bolso.",
    };
  }

  if (feeling?.id === "stress") {
    return {
      emoji: "😮‍💨",
      title: "Mês de contas",
      message: "A rotina levou a maior fatia. Quando sobrar, a gente guarda um respiro.",
    };
  }

  if (feeling?.id === "guilt") {
    return {
      emoji: "🙈",
      title: "Mês da formiguinha",
      message: "Teve gasto escondido da consciência. Anotar já alivia.",
    };
  }

  if (input.incomeCents > 0 && left >= input.incomeCents * 0.2) {
    return {
      emoji: "😌",
      title: "Mês tranquilo",
      message: "Sobrou uma fatia boa. A Moedinha está de barriga cheia.",
    };
  }

  return {
    emoji: "🙂",
    title: "Mês no eixo",
    message: "Nada dramático por aqui. Você está no controle, e isso já vale.",
  };
}
