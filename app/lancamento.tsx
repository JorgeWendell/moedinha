import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateField } from "@/src/components/date-field";
import { ChoiceRow, EmojiRow, ErrorNote, Field, PrimaryButton } from "@/src/components/ui";
import { EMOTIONS, type EmotionId } from "@/src/domain/emotions";
import { localISODate } from "@/src/domain/month";
import { formatMoney, parseMoneyToCents } from "@/src/domain/money";
import { ENTRY_TYPES, PAYMENTS, type EntryType, type PaymentId } from "@/src/domain/presets";
import { api } from "@/src/lib/api";
import { confirmAction } from "@/src/lib/confirm";
import { useMonth } from "@/src/state/month";
import { colors, fonts } from "@/src/theme";

export default function Lancamento() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { month } = useMonth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const today = localISODate();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: api.accounts });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const entries = useQuery({
    queryKey: ["entries", month, "all"],
    queryFn: () => api.entries(month, "all"),
    enabled: Boolean(id),
  });
  const existing = entries.data?.find((entry) => entry.id === id);

  const [type, setType] = useState<EntryType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(today.startsWith(month) ? today : `${month}-01`);
  const [emotion, setEmotion] = useState<EmotionId>("calm");
  const [payment, setPayment] = useState<PaymentId>("pix");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(!id);

  useEffect(() => {
    if (!existing || ready) return;
    setType(existing.type);
    setTitle(existing.title);
    setAmount((existing.amountCents / 100).toFixed(2).replace(".", ","));
    setNote(existing.note ?? "");
    setOccurredOn(existing.occurredOn);
    setEmotion(existing.emotion);
    setPayment(existing.payment);
    setCategoryId(existing.categoryId);
    setAccountId(existing.bankAccountId);
    setReady(true);
  }, [existing, ready]);

  useEffect(() => {
    if (!accountId && accounts.data?.[0]) setAccountId(accounts.data[0].id);
  }, [accountId, accounts.data]);

  const visibleCategories = (categories.data ?? []).filter(
    (category) => category.kind === "any" || category.kind === type,
  );

  const save = useMutation({
    mutationFn: async () => {
      const amountCents = parseMoneyToCents(amount);
      if (!amountCents) throw new Error("Escreve um valor, tipo 42,90.");
      if (!title.trim()) throw new Error("Dá um nome para esse lançamento.");
      if (!accountId) throw new Error("Cria uma conta antes.");
      const payload = {
        type,
        amountCents,
        title: title.trim(),
        note: note.trim() || null,
        occurredOn,
        emotion,
        payment,
        categoryId,
        bankAccountId: accountId,
      };
      if (id) return api.updateEntry(id, payload);
      return api.createEntry(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.back();
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteEntry(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.back();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Text style={styles.title}>{id ? "Editar lançamento" : "Novo lançamento"}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>fechar</Text>
          </Pressable>
        </View>

        <ChoiceRow
          options={ENTRY_TYPES.map((item) => ({ id: item.id, label: item.label, emoji: item.emoji }))}
          value={type}
          onChange={(next) => {
            setType(next);
            setCategoryId(null);
            setEmotion(next === "income" ? "pride" : next === "investment" ? "focus" : "calm");
          }}
        />

        <Field label="O que foi" value={title} onChangeText={setTitle} placeholder="Almoço, salário, aporte..." />
        <Field label="Valor" value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" />
        <DateField label="Quando" value={occurredOn} onChange={setOccurredOn} />

        <Text style={styles.section}>Conta</Text>
        <View style={styles.wrap}>
          {(accounts.data ?? []).map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setAccountId(account.id)}
              style={[styles.pill, accountId === account.id && styles.pillOn]}
            >
              <Text style={[styles.pillText, accountId === account.id && styles.pillTextOn]}>
                {account.emoji} {account.name} · {formatMoney(account.balanceCents)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Categoria</Text>
          <Pressable onPress={() => router.push("/categorias")}>
            <Text style={styles.link}>criar</Text>
          </Pressable>
        </View>
        <View style={styles.wrap}>
          <Pressable onPress={() => setCategoryId(null)} style={[styles.pill, !categoryId && styles.pillOn]}>
            <Text style={[styles.pillText, !categoryId && styles.pillTextOn]}>sem categoria</Text>
          </Pressable>
          {visibleCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                setEmotion(category.emotion);
              }}
              style={[styles.pill, categoryId === category.id && styles.pillOn]}
            >
              <Text style={[styles.pillText, categoryId === category.id && styles.pillTextOn]}>
                {category.emoji} {category.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Como você se sentiu?</Text>
        <EmojiRow
          emojis={EMOTIONS.map((item) => item.emoji)}
          value={EMOTIONS.find((item) => item.id === emotion)?.emoji ?? "🙂"}
          onChange={(emoji) => {
            const found = EMOTIONS.find((item) => item.emoji === emoji);
            if (found) setEmotion(found.id);
          }}
        />

        <Text style={styles.section}>Como pagou</Text>
        <ChoiceRow
          options={PAYMENTS.map((item) => ({ id: item.id, label: item.label, emoji: item.emoji }))}
          value={payment}
          onChange={setPayment}
        />

        <Field label="Anotação" value={note} onChangeText={setNote} placeholder="opcional" />
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton
          label={save.isPending ? "Salvando..." : id ? "Salvar mudanças" : "Lançar"}
          onPress={() => save.mutate()}
          disabled={save.isPending || !ready}
        />
        {id ? (
          <PrimaryButton
            label="Apagar lançamento"
            tone="coral"
            disabled={remove.isPending}
            onPress={async () => {
              const ok = await confirmAction("O saldo da conta volta ao que era antes desse lançamento.");
              if (ok) remove.mutate();
            }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: 14 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  close: { fontFamily: fonts.bodyStrong, color: colors.grape, fontSize: 16 },
  section: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { fontFamily: fonts.bodyStrong, color: colors.grape },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { backgroundColor: colors.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  pillOn: { backgroundColor: colors.ink },
  pillText: { fontFamily: fonts.bodyStrong, color: colors.ink },
  pillTextOn: { color: "#FFF6EA" },
});
