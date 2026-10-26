import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Bubble, PrimaryButton } from "@/src/components/ui";
import { formatMoney } from "@/src/domain/money";
import { ACCOUNT_KINDS } from "@/src/domain/presets";
import { api } from "@/src/lib/api";
import { colors, fonts, shadow } from "@/src/theme";

function inkOn(color: string) {
  const hex = color.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luma = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luma > 0.72 ? colors.ink : "#FFFDF8";
}

export default function Contas() {
  const query = useQuery({ queryKey: ["accounts"], queryFn: api.accounts });
  const total = (query.data ?? []).reduce((sum, account) => sum + account.balanceCents, 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Contas</Text>
      <View style={styles.total}>
        <Text style={styles.totalLabel}>somando tudo</Text>
        <Text style={[styles.totalValue, total < 0 && { color: colors.coral }]}>{formatMoney(total)}</Text>
      </View>

      {query.isError ? <Bubble emoji="📡" title="Não carregou" message={query.error.message} /> : null}

      {(query.data ?? []).map((account, index) => {
        const kind = ACCOUNT_KINDS.find((item) => item.id === account.kind)?.label ?? account.kind;
        return (
          <Pressable
            key={account.id}
            onPress={() => router.push({ pathname: "/conta-form", params: { id: account.id } })}
            style={[
              styles.card,
              {
                backgroundColor: account.color,
                transform: [{ rotate: index % 2 === 0 ? "-1.5deg" : "1.5deg" }],
              },
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.emoji}>{account.emoji}</Text>
              <Text style={[styles.kind, { color: inkOn(account.color) }]}>{kind}</Text>
            </View>
            <Text style={[styles.name, { color: inkOn(account.color) }]}>{account.name}</Text>
            <Text style={[styles.institution, { color: inkOn(account.color) }]}>{account.institution || "sem apelido de banco"}</Text>
            <Text style={[styles.balance, { color: inkOn(account.color) }]}>{formatMoney(account.balanceCents)}</Text>
          </Pressable>
        );
      })}

      {!query.isLoading && query.data?.length === 0 ? (
        <Bubble emoji="👛" title="Cadê o bolso?" message="Cria uma carteira, um banco ou a corretora." />
      ) : null}

      <PrimaryButton label="Nova conta" onPress={() => router.push("/conta-form")} tone="sun" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  total: { gap: 2 },
  totalLabel: { fontFamily: fonts.bodyStrong, color: colors.inkSoft },
  totalValue: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  card: {
    borderRadius: 28,
    padding: 18,
    gap: 4,
    ...shadow,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  emoji: { fontSize: 32 },
  kind: {
    backgroundColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontFamily: fonts.bodyStrong,
  },
  name: { fontFamily: fonts.display, fontSize: 28, color: "#FFFDF8", marginTop: 12 },
  institution: { fontFamily: fonts.body, color: "rgba(255,253,248,0.85)" },
  balance: { fontFamily: fonts.display, fontSize: 26, color: "#FFFDF8", marginTop: 10 },
});
