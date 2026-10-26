import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EntryRow } from "@/src/components/entry-row";
import { Bubble, ChoiceRow, MonthSwitcher } from "@/src/components/ui";
import { formatDayLabel } from "@/src/domain/month";
import type { Entry } from "@/src/domain/types";
import { api } from "@/src/lib/api";
import { useMonth } from "@/src/state/month";
import { colors, fonts, shadow } from "@/src/theme";

const filters = [
  { id: "all", label: "Tudo", emoji: "✨" },
  { id: "income", label: "Receitas", emoji: "🌱" },
  { id: "expense", label: "Despesas", emoji: "🎈" },
  { id: "investment", label: "Investiu", emoji: "📈" },
] as const;

export default function Fluxo() {
  const { month } = useMonth();
  const [type, setType] = useState<(typeof filters)[number]["id"]>("all");
  const query = useQuery({
    queryKey: ["entries", month, type],
    queryFn: () => api.entries(month, type),
  });

  const groups = groupByDay(query.data ?? []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Fluxo</Text>
        <MonthSwitcher />
        <ChoiceRow options={[...filters]} value={type} onChange={setType} />
        <Pressable onPress={() => router.push("/categorias")} style={styles.categoryLink}>
          <Text style={styles.categoryText}>Categorias com carinha  ›</Text>
        </Pressable>

        {query.isError ? <Bubble emoji="📡" title="Não carregou" message={query.error.message} /> : null}

        {!query.isLoading && groups.length === 0 ? (
          <Bubble
            emoji="🎈"
            title="Mês quietinho"
            message="Nenhum lançamento nesse filtro. O botão redondo embaixo cria o primeiro."
          />
        ) : null}

        {groups.map(([day, items]) => (
          <View key={day} style={styles.group}>
            <Text style={styles.day}>{formatDayLabel(day)}</Text>
            {items.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={() => router.push("/lancamento")} style={styles.fab}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

function groupByDay(entries: Entry[]) {
  const map = new Map<string, Entry[]>();
  for (const entry of entries) {
    const list = map.get(entry.occurredOn) ?? [];
    list.push(entry);
    map.set(entry.occurredOn, list);
  }
  return [...map.entries()];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  categoryLink: { alignSelf: "flex-start" },
  categoryText: { fontFamily: fonts.bodyStrong, color: colors.grape, fontSize: 15 },
  group: { gap: 8 },
  day: { fontFamily: fonts.bodyStrong, color: colors.inkSoft, marginTop: 6 },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 108,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sun,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  fabText: { fontSize: 34, color: colors.ink, marginTop: -2 },
});
