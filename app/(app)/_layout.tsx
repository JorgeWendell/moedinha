import { Redirect, Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Boot } from "@/src/components/ui";
import { authClient } from "@/src/lib/auth-client";
import { colors, fonts } from "@/src/theme";

function TabEmoji({ emoji }: { emoji: string }) {
  return <Text style={styles.emoji}>{emoji}</Text>;
}

export default function AppTabs() {
  const { data, isPending } = authClient.useSession();
  const insets = useSafeAreaInsets();
  if (isPending) return <Boot />;
  if (!data) return <Redirect href="/(auth)/entrar" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFE7A8",
        tabBarInactiveTintColor: "#B7A9C9",
        tabBarLabelStyle: { fontFamily: fonts.bodyStrong, fontSize: 11 },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 68,
          borderRadius: 26,
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Hoje", tabBarIcon: () => <TabEmoji emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="fluxo"
        options={{ title: "Fluxo", tabBarIcon: () => <TabEmoji emoji="💸" /> }}
      />
      <Tabs.Screen
        name="contas"
        options={{ title: "Contas", tabBarIcon: () => <TabEmoji emoji="🏦" /> }}
      />
      <Tabs.Screen
        name="metas"
        options={{ title: "Metas", tabBarIcon: () => <TabEmoji emoji="🎯" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 18 },
});
