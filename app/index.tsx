import { Redirect } from "expo-router";

import { Boot } from "@/src/components/ui";
import { authClient } from "@/src/lib/auth-client";

export default function Index() {
  const { data, isPending } = authClient.useSession();
  if (isPending) return <Boot />;
  if (!data) return <Redirect href="/(auth)/entrar" />;
  return <Redirect href="/(app)" />;
}
