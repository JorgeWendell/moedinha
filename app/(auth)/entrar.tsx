import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bubble, ErrorNote, Field, PrimaryButton } from "@/src/components/ui";
import { authClient } from "@/src/lib/auth-client";
import { colors, fonts } from "@/src/theme";

function friendlyAuthError(message?: string) {
  const text = message?.toLowerCase() ?? "";
  if (text.includes("invalid") || text.includes("password") || text.includes("credential")) {
    return "E-mail ou senha não batem.";
  }
  if (text.includes("exist") || text.includes("already")) return "Esse e-mail já tem um bolso.";
  if (text.includes("short") || text.includes("length")) return "A senha precisa ter pelo menos 8 caracteres.";
  return message || "Não rolou agora. Tenta de novo.";
}

export default function Entrar() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "up") {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(friendlyAuthError(result.error.message));
          return;
        }
        router.replace("/(app)");
        return;
      }
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (result.error) {
        setError(friendlyAuthError(result.error.message));
        return;
      }
      router.replace("/(app)");
    } catch {
      setError("Não consegui falar com o servidor. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Moedinha</Text>
        <Bubble
          emoji={mode === "up" ? "😄" : "🪙"}
          title={mode === "up" ? "Bora abrir seu bolso" : "Oi, eu guardo o seu mês"}
          message="Controle financeiro com humor. Receita, despesa, investimento e meta — cada uma com uma carinha."
        />

        <View style={styles.card}>
          {mode === "up" ? (
            <Field label="Como te chamo" value={name} onChangeText={setName} placeholder="Seu nome" autoCapitalize="words" />
          ) : null}
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="mínimo 8 caracteres"
            secureTextEntry
          />
          <ErrorNote>{error}</ErrorNote>
          <PrimaryButton
            label={loading ? "Entrando..." : mode === "up" ? "Criar meu bolso" : "Entrar na brincadeira"}
            onPress={submit}
            disabled={loading || !email || password.length < 8 || (mode === "up" && name.trim().length < 2)}
          />
        </View>

        <Pressable onPress={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }}>
          <Text style={styles.switch}>
            {mode === "in" ? "Ainda não tem conta? Cria uma agora" : "Já tem conta? Entra"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: 18 },
  brand: { fontFamily: fonts.display, fontSize: 40, color: colors.ink },
  card: {
    backgroundColor: "#FFF1DE",
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },
  switch: {
    textAlign: "center",
    fontFamily: fonts.bodyStrong,
    color: colors.grape,
    fontSize: 15,
  },
});
