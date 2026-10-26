import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Bubble, ErrorNote, PrimaryButton } from "@/src/components/ui";
import { formatDayLabel } from "@/src/domain/month";
import { formatMoney, parseMoneyToCents } from "@/src/domain/money";
import { localISODate } from "@/src/domain/month";
import { api } from "@/src/lib/api";
import { confirmAction } from "@/src/lib/confirm";
import { colors, fonts } from "@/src/theme";

export default function Metas() {
  const queryClient = useQueryClient();
  const goals = useQuery({ queryKey: ["goals"], queryFn: api.goals });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: api.accounts });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Metas</Text>
      <Bubble
        emoji="🎯"
        title="O pote do desejo"
        message="Cada aporte sai de uma conta e enche a meta. Quando chegar, a Moedinha solta fogos imaginários."
      />

      {goals.isError ? <Bubble emoji="📡" title="Não carregou" message={goals.error.message} /> : null}

      {(goals.data ?? []).map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          accounts={accounts.data ?? []}
          onChange={refresh}
        />
      ))}

      {!goals.isLoading && goals.data?.length === 0 ? (
        <Text style={styles.empty}>Nenhuma meta ainda. Viagem, reserva, aquele curso.</Text>
      ) : null}

      <PrimaryButton label="Nova meta" onPress={() => router.push("/meta-form")} tone="sun" />
    </ScrollView>
  );
}

function GoalCard({
  goal,
  accounts,
  onChange,
}: {
  goal: Awaited<ReturnType<typeof api.goals>>[number];
  accounts: Awaited<ReturnType<typeof api.accounts>>;
  onChange: () => void;
}) {
  const [amount, setAmount] = useState("50");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const selectedAccount = accountId || accounts[0]?.id || "";
  const progress = goal.targetCents === 0 ? 0 : Math.min(1, goal.savedCents / goal.targetCents);
  const done = goal.savedCents >= goal.targetCents;

  const deposit = useMutation({
    mutationFn: () => {
      const cents = parseMoneyToCents(amount);
      if (!cents) throw new Error("Valor inválido.");
      if (!selectedAccount) throw new Error("Cria uma conta antes de guardar.");
      return api.deposit(goal.id, {
        amountCents: cents,
        bankAccountId: selectedAccount,
        occurredOn: localISODate(),
      });
    },
    onSuccess: () => {
      setError("");
      onChange();
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeDeposit = useMutation({
    mutationFn: (id: string) => api.deleteDeposit(id),
    onSuccess: onChange,
  });

  const removeGoal = useMutation({
    mutationFn: () => api.deleteGoal(goal.id),
    onSuccess: onChange,
  });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.emoji}>{done ? "🎉" : goal.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{goal.name}</Text>
          <Text style={styles.caption}>
            {formatMoney(goal.savedCents)} de {formatMoney(goal.targetCents)}
            {goal.deadline ? ` · até ${formatDayLabel(goal.deadline)}` : ""}
          </Text>
        </View>
        <Pressable
          onPress={async () => {
            const ok = await confirmAction("Apagar a meta devolve os aportes para as contas.");
            if (ok) removeGoal.mutate();
          }}
        >
          <Text style={styles.remove}>apagar</Text>
        </Pressable>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(progress * 100, progress > 0 ? 8 : 0)}%`, backgroundColor: goal.color }]} />
      </View>
      <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>

      <View style={styles.chips}>
        {["20", "50", "100", "200"].map((value) => (
          <Pressable key={value} onPress={() => setAmount(value)} style={[styles.chip, amount === value && styles.chipOn]}>
            <Text style={[styles.chipText, amount === value && styles.chipTextOn]}>R$ {value}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accounts}>
        {accounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => setAccountId(account.id)}
            style={[styles.account, selectedAccount === account.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, selectedAccount === account.id && styles.chipTextOn]}>
              {account.emoji} {account.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ErrorNote>{error}</ErrorNote>
      <PrimaryButton
        label={deposit.isPending ? "Guardando..." : "Guardar nesta meta"}
        onPress={() => deposit.mutate()}
        disabled={deposit.isPending}
        tone="leaf"
      />

      {goal.deposits.slice(0, 3).map((item) => (
        <Pressable key={item.id} onPress={() => removeDeposit.mutate(item.id)} style={styles.deposit}>
          <Text style={styles.depositText}>
            {item.accountEmoji} {formatMoney(item.amountCents)} · {formatDayLabel(item.occurredOn)} · toque para desfazer
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  empty: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 15 },
  card: { backgroundColor: colors.white, borderRadius: 28, padding: 16, gap: 10 },
  head: { flexDirection: "row", gap: 10, alignItems: "center" },
  emoji: { fontSize: 32 },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  caption: { fontFamily: fonts.body, color: colors.inkSoft },
  remove: { fontFamily: fonts.bodyStrong, color: colors.coral },
  track: { height: 16, backgroundColor: "#F6E7D4", borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  percent: { fontFamily: fonts.bodyStrong, color: colors.inkSoft },
  chips: { flexDirection: "row", gap: 8 },
  chip: { backgroundColor: colors.canvas, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.bodyStrong, color: colors.ink },
  chipTextOn: { color: "#FFF6EA" },
  accounts: { gap: 8 },
  account: { backgroundColor: colors.canvas, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  deposit: { paddingVertical: 2 },
  depositText: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 },
});
