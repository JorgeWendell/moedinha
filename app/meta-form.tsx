import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DateField } from "@/src/components/date-field";
import { ColorRow, EmojiRow, ErrorNote, Field, PrimaryButton } from "@/src/components/ui";
import { localISODate } from "@/src/domain/month";
import { parseMoneyToCents } from "@/src/domain/money";
import { ACCOUNT_COLORS, GOAL_EMOJIS } from "@/src/domain/presets";
import { api } from "@/src/lib/api";
import { colors, fonts } from "@/src/theme";

export default function MetaForm() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState(ACCOUNT_COLORS[2]);
  const [deadline, setDeadline] = useState(localISODate());
  const [useDeadline, setUseDeadline] = useState(false);
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: () => {
      const targetCents = parseMoneyToCents(target);
      if (!name.trim()) throw new Error("A meta precisa de um nome.");
      if (!targetCents) throw new Error("Quanto você quer juntar?");
      return api.createGoal({
        name: name.trim(),
        emoji,
        color,
        targetCents,
        deadline: useDeadline ? deadline : null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      router.back();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.head}>
        <Text style={styles.title}>Nova meta</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>fechar</Text>
        </Pressable>
      </View>
      <Field label="Quero juntar para" value={name} onChangeText={setName} placeholder="Viagem, reserva, notebook..." />
      <Field label="Valor da meta" value={target} onChangeText={setTarget} placeholder="0,00" keyboardType="decimal-pad" />
      <Text style={styles.section}>Ícone</Text>
      <EmojiRow emojis={GOAL_EMOJIS} value={emoji} onChange={setEmoji} />
      <Text style={styles.section}>Cor do pote</Text>
      <ColorRow colors={ACCOUNT_COLORS} value={color} onChange={setColor} />
      <Pressable onPress={() => setUseDeadline((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{useDeadline ? "Com prazo" : "Sem pressa — tocar para colocar prazo"}</Text>
      </Pressable>
      {useDeadline ? <DateField label="Até quando" value={deadline} onChange={setDeadline} /> : null}
      <ErrorNote>{error}</ErrorNote>
      <PrimaryButton label={save.isPending ? "Criando..." : "Criar meta"} onPress={() => save.mutate()} disabled={save.isPending} tone="sun" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: 14 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  close: { fontFamily: fonts.bodyStrong, color: colors.grape, fontSize: 16 },
  section: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  toggle: { backgroundColor: colors.white, borderRadius: 18, padding: 14 },
  toggleText: { fontFamily: fonts.bodyStrong, color: colors.ink },
});
