import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EntryRow } from "@/src/components/entry-row";
import { Bubble, MonthSwitcher, PrimaryButton } from "@/src/components/ui";
import { emotionById } from "@/src/domain/emotions";
import { formatMoney } from "@/src/domain/money";
import { api } from "@/src/lib/api";
import { authClient, clearWebToken } from "@/src/lib/auth-client";
import { useMonth } from "@/src/state/month";
import { colors, fonts, shadow } from "@/src/theme";

export default function Hoje() {
  const { data: session } = authClient.useSession();
  const { month } = useMonth();
  const dashboard = useQuery({
    queryKey: ["dashboard", month],
    queryFn: () => api.dashboard(month),
  });
  const firstName = session?.user.name.split(" ")[0] ?? "você";
  const data = dashboard.data;
  const maxCategory = data?.categories[0]?.cents || 1;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View>
          <Text style={styles.hello}>Oi, {firstName}</Text>
          <Text style={styles.sub}>seu mês, com humor</Text>
        </View>
        <Pressable
          onPress={async () => {
            await authClient.signOut();
            await clearWebToken();
          }}
          style={styles.out}
        >
          <Text style={styles.outText}>sair</Text>
        </Pressable>
      </View>

      <MonthSwitcher />

      {dashboard.isError ? (
        <Bubble emoji="📡" title="API sumiu" message={dashboard.error.message} />
      ) : null}

      {data ? (
        <>
          <Bubble emoji={data.mood.emoji} title={data.mood.title} message={data.mood.message} />

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>sobrou no mês</Text>
            <Text style={[styles.heroValue, data.leftCents < 0 && { color: colors.coral }]}>
              {formatMoney(data.leftCents)}
            </Text>
            <Text style={styles.heroHint}>nas contas agora: {formatMoney(data.accountsTotalCents)}</Text>
          </View>

          <View style={styles.stats}>
            <Stat label="entrou" value={data.incomeCents} tint={colors.mint} color={colors.leaf} />
            <Stat label="saiu" value={data.expenseCents} tint={colors.blush} color={colors.coral} />
            <Stat label="investiu" value={data.investmentCents} tint={colors.lilac} color={colors.grape} />
            <Stat label="guardou" value={data.savedCents} tint="#FFF1C9" color="#C4840A" />
          </View>

          {data.emotions.length ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Humor dos gastos</Text>
              <View style={styles.emotions}>
                {data.emotions.map((item) => {
                  const feeling = emotionById(item.emotion);
                  return (
                    <View key={item.emotion} style={styles.emotion}>
                      <Text style={styles.emotionEmoji}>{feeling.emoji}</Text>
                      <Text style={styles.emotionLabel}>{feeling.label}</Text>
                      <Text style={styles.emotionValue}>{formatMoney(item.cents)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {data.categories.length ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Para onde foi</Text>
              {data.categories.slice(0, 5).map((category) => (
                <View key={category.id} style={styles.barRow}>
                  <Text style={styles.barEmoji}>{category.emoji}</Text>
                  <View style={styles.barCopy}>
                    <View style={styles.barTitleRow}>
                      <Text style={styles.barName}>{category.name}</Text>
                      <Text style={styles.barValue}>{formatMoney(category.cents)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.max(8, (category.cents / maxCategory) * 100)}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Últimos lançamentos</Text>
              <Pressable onPress={() => router.push("/lancamento")}>
                <Text style={styles.link}>novo</Text>
              </Pressable>
            </View>
            {data.recent.length ? (
              data.recent.map((entry) => <EntryRow key={entry.id} entry={entry} />)
            ) : (
              <PrimaryButton label="Lançar a primeira moedinha" onPress={() => router.push("/lancamento")} />
            )}
          </View>
        </>
      ) : dashboard.isLoading ? (
        <Bubble emoji="🪙" title="Abrindo o mês" message="Estou somando receitas, gastos e aquele cafezinho." />
      ) : null}
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  tint,
  color,
}: {
  label: string;
  value: number;
  tint: string;
  color: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{formatMoney(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 130, gap: 16 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  sub: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 15 },
  out: { backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  outText: { fontFamily: fonts.bodyStrong, color: colors.inkSoft },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 32,
    padding: 22,
    gap: 4,
    ...shadow,
  },
  heroLabel: { fontFamily: fonts.bodyStrong, color: "#E7D7FF", textTransform: "uppercase", letterSpacing: 1 },
  heroValue: { fontFamily: fonts.display, fontSize: 40, color: "#FFE7A8" },
  heroHint: { fontFamily: fonts.body, color: "#D9CCEA" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", flexGrow: 1, borderRadius: 22, padding: 14, gap: 4 },
  statLabel: { fontFamily: fonts.bodyStrong, color: colors.inkSoft, fontSize: 13 },
  statValue: { fontFamily: fonts.displaySoft, fontSize: 18 },
  block: { gap: 10 },
  blockHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  blockTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  link: { fontFamily: fonts.bodyStrong, color: colors.grape, fontSize: 15 },
  emotions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emotion: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    minWidth: 92,
    gap: 2,
  },
  emotionEmoji: { fontSize: 22 },
  emotionLabel: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 13 },
  emotionValue: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 12 },
  barRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  barEmoji: { fontSize: 22, width: 32 },
  barCopy: { flex: 1, gap: 6 },
  barTitleRow: { flexDirection: "row", justifyContent: "space-between" },
  barName: { fontFamily: fonts.bodyStrong, color: colors.ink },
  barValue: { fontFamily: fonts.body, color: colors.inkSoft },
  track: { height: 10, backgroundColor: "#F4E7D6", borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.sun, borderRadius: 99 },
});
