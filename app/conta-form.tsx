import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChoiceRow, ColorRow, EmojiRow, ErrorNote, Field, PrimaryButton } from "@/src/components/ui";
import { parseMoneyToCents } from "@/src/domain/money";
import { ACCOUNT_COLORS, ACCOUNT_EMOJIS, ACCOUNT_KINDS, type AccountKind } from "@/src/domain/presets";
import { api } from "@/src/lib/api";
import { confirmAction } from "@/src/lib/confirm";
import { colors, fonts } from "@/src/theme";

export default function ContaForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: api.accounts });
  const existing = accounts.data?.find((account) => account.id === id);

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [emoji, setEmoji] = useState("🏦");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [kind, setKind] = useState<AccountKind>("checking");
  const [opening, setOpening] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(!id);

  useEffect(() => {
    if (!existing || ready) return;
    setName(existing.name);
    setInstitution(existing.institution ?? "");
    setEmoji(existing.emoji);
    setColor(existing.color);
    setKind(existing.kind);
    setReady(true);
  }, [existing, ready]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        institution: institution.trim() || null,
        emoji,
        color,
        kind,
      };
      if (!payload.name) throw new Error("A conta precisa de um nome.");
      if (id) return api.updateAccount(id, payload);
      const openingCents = opening.trim() ? parseMoneyToCents(opening) : 0;
      if (openingCents === null) throw new Error("Saldo inicial inválido.");
      return api.createAccount({ ...payload, openingCents });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteAccount(id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
        <Text style={styles.title}>{id ? "Editar conta" : "Nova conta"}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>fechar</Text>
        </Pressable>
      </View>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Nubank, carteira, XP..." />
      <Field label="Banco ou apelido" value={institution} onChangeText={setInstitution} placeholder="opcional" />
      <Text style={styles.section}>Tipo</Text>
      <ChoiceRow options={ACCOUNT_KINDS.map((item) => ({ ...item }))} value={kind} onChange={setKind} />
      <Text style={styles.section}>Carinha</Text>
      <EmojiRow emojis={ACCOUNT_EMOJIS} value={emoji} onChange={setEmoji} />
      <Text style={styles.section}>Cor</Text>
      <ColorRow colors={ACCOUNT_COLORS} value={color} onChange={setColor} />
      {!id ? (
        <Field label="Saldo que já está lá" value={opening} onChangeText={setOpening} placeholder="0,00" keyboardType="decimal-pad" />
      ) : (
        <Text style={styles.hint}>O saldo muda com lançamentos e aportes de meta.</Text>
      )}
      <ErrorNote>{error}</ErrorNote>
      <PrimaryButton label={save.isPending ? "Salvando..." : "Salvar conta"} onPress={() => save.mutate()} disabled={save.isPending || !ready} />
      {id ? (
        <PrimaryButton
          label="Apagar conta"
          tone="coral"
          onPress={async () => {
            const ok = await confirmAction("Só dá para apagar conta sem lançamentos.");
            if (ok) remove.mutate();
          }}
        />
      ) : null}
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
  hint: { fontFamily: fonts.body, color: colors.inkSoft },
});
