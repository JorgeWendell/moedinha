import { Alert, Platform } from "react-native";

export function confirmAction(message: string) {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(message));

  return new Promise<boolean>((resolve) => {
    Alert.alert("Tem certeza?", message, [
      { text: "Deixa", style: "cancel", onPress: () => resolve(false) },
      { text: "Pode apagar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
