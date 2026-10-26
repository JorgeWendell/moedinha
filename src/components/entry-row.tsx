import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { emotionById } from "@/src/domain/emotions";
import { formatMoney } from "@/src/domain/money";
import type { Entry } from "@/src/domain/types";
import { colors, fonts } from "@/src/theme";

const typeStyle = {
  income: { sign: "+", color: colors.leaf, bg: colors.mint },
  expense: { sign: "−", color: colors.coral, bg: colors.blush },
  investment: { sign: "↗", color: colors.grape, bg: colors.lilac },
};

export function EntryRow({ entry }: { entry: Entry }) {
  const tone = typeStyle[entry.type];
  const feeling = emotionById(entry.emotion);
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/lancamento", params: { id: entry.id } })}
      style={styles.row}
    >
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        <Text style={styles.badgeEmoji}>{entry.categoryEmoji || feeling.emoji}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.meta}>
          {entry.categoryName || feeling.label} · {entry.accountEmoji} {entry.accountName}
        </Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: tone.color }]}>
          {tone.sign} {formatMoney(entry.amountCents)}
        </Text>
        <Text style={styles.feeling}>{feeling.emoji}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeEmoji: { fontSize: 22 },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 16 },
  meta: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 },
  amountWrap: { alignItems: "flex-end", gap: 2 },
  amount: { fontFamily: fonts.displaySoft, fontSize: 15 },
  feeling: { fontSize: 14 },
});
