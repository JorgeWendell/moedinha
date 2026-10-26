import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";

const TOKEN_KEY = "moedinha.token";

const storage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return SecureStore.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    SecureStore.setItem(key, value);
  },
  getItemAsync: (key: string) => {
    if (Platform.OS === "web") return Promise.resolve(localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333";

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include",
    onSuccess: (ctx) => {
      if (Platform.OS !== "web") return;
      const token = ctx.response.headers.get("set-auth-token");
      const requestUrl = String(ctx.request.url);
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (requestUrl.includes("/sign-out")) localStorage.removeItem(TOKEN_KEY);
    },
  },
  plugins: [
    expoClient({
      scheme: "financecontrol",
      storagePrefix: "financecontrol",
      storage,
    }),
  ],
});

export async function authHeaders() {
  if (Platform.OS === "web") {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  const cookie = await authClient.getCookie();
  return cookie ? { cookie } : {};
}

export async function clearWebToken() {
  if (Platform.OS === "web") localStorage.removeItem(TOKEN_KEY);
}
