import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChoiceRow, ColorRow, EmojiRow, ErrorNote, Field, PrimaryButton } from "@/src/components/ui";
import { EMOTIONS, emotionById, type EmotionId } from "@/src/domain/emotions";
import { ACCOUNT_COLORS, CATEGORY_KINDS, ENTRY_EMOJIS, type CategoryKind } from "@/src/domain/presets";
import { api } from "@/src/lib/api";
import { confirmAction } from "@/src/lib/confirm";
import { colors, fonts } from "@/src/theme";

export default function Categorias() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories });
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [emotion, setEmotion] = useState<EmotionId>("joy");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [color, setColor] = useState(ACCOUNT_COLORS[1]);
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("A categoria precisa de um nome.");
      return api.createCategory({ name: name.trim(), emoji, emotion, color, kind });
    },
    onSuccess: async () => {
      setName("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err: Error) => setError(err.message),
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.head}>
        <Text style={styles.title}>Categorias</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.close}>fechar</Text>
        </Pressable>
      </View>
      <Text style={styles.lead}>Cada categoria carrega uma emoção. O mês inteiro ganha um humor a partir disso.</Text>

      {(categories.data ?? []).map((category) => {
        const feeling = emotionById(category.emotion);
        return (
          <View key={category.id} style={styles.row}>
            <Text style={styles.emoji}>{category.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{category.name}</Text>
              <Text style={styles.meta}>
                {feeling.emoji} {feeling.label} · {CATEGORY_KINDS.find((item) => item.id === category.kind)?.label}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                const ok = await confirmAction(`Apagar ${category.name}? Os lançamentos ficam sem categoria.`);
                if (ok) remove.mutate(category.id);
              }}
            >
              <Text style={styles.remove}>apagar</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.section}>Nova categoria</Text>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Pet, streaming, mercado..." />
      <ChoiceRow options={CATEGORY_KINDS.map((item) => ({ ...item }))} value={kind} onChange={setKind} />
      <EmojiRow emojis={ENTRY_EMOJIS} value={emoji} onChange={setEmoji} />
      <Text style={styles.section}>Emoção</Text>
      <EmojiRow
        emojis={EMOTIONS.map((item) => item.emoji)}
        value={EMOTIONS.find((item) => item.id === emotion)?.emoji ?? "🙂"}
        onChange={(next) => {
          const found = EMOTIONS.find((item) => item.emoji === next);
          if (found) setEmotion(found.id);
        }}
      />
      <ColorRow colors={ACCOUNT_COLORS} value={color} onChange={setColor} />
      <ErrorNote>{error}</ErrorNote>
      <PrimaryButton label={create.isPending ? "Criando..." : "Criar categoria"} onPress={() => create.mutate()} disabled={create.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: 12 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  close: { fontFamily: fonts.bodyStrong, color: colors.grape, fontSize: 16 },
  lead: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 15, lineHeight: 21 },
  row: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  emoji: { fontSize: 26 },
  name: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 16 },
  meta: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 13 },
  remove: { fontFamily: fonts.bodyStrong, color: colors.coral },
  section: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginTop: 8 },
});
