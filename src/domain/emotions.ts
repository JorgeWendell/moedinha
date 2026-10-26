export const EMOTIONS = [
  { id: "joy", emoji: "🤩", label: "Alegria" },
  { id: "calm", emoji: "😌", label: "Calma" },
  { id: "love", emoji: "🥰", label: "Carinho" },
  { id: "pride", emoji: "💪", label: "Orgulho" },
  { id: "focus", emoji: "🎯", label: "Foco" },
  { id: "stress", emoji: "😰", label: "Aperto" },
  { id: "guilt", emoji: "🙈", label: "Culpa" },
  { id: "neutral", emoji: "🙂", label: "Neutro" },
] as const;

export type EmotionId = (typeof EMOTIONS)[number]["id"];

export const EMOTION_IDS = EMOTIONS.map((emotion) => emotion.id) as [
  EmotionId,
  ...EmotionId[],
];

export function emotionById(id: string) {
  return EMOTIONS.find((emotion) => emotion.id === id) ?? EMOTIONS[7];
}
