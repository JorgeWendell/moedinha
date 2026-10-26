import { Redirect, Stack } from "expo-router";

import { Boot } from "@/src/components/ui";
import { authClient } from "@/src/lib/auth-client";

export default function AuthLayout() {
  const { data, isPending } = authClient.useSession();
  if (isPending) return <Boot />;
  if (data) return <Redirect href="/(app)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
