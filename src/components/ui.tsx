import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { formatMonth, shiftMonth } from "@/src/domain/month";
import { useMonth } from "@/src/state/month";
import { colors, fonts, shadow } from "@/src/theme";

export function tap() {
  if (Platform.OS === "web") return;
  Haptics.selectionAsync().catch(() => undefined);
}

export function Mascot({ emoji, size = 76 }: { emoji: string; size?: number }) {
  return (
    <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={styles.shine} />
      <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
    </View>
  );
}

export function Bubble({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.bubble}>
      <Mascot emoji={emoji} />
      <View style={styles.bubbleCopy}>
        <Text style={styles.bubbleTitle}>{title}</Text>
        <Text style={styles.bubbleBody}>{message}</Text>
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = "ink",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "ink" | "leaf" | "coral" | "sun";
}) {
  const background = {
    ink: colors.ink,
    leaf: colors.leaf,
    coral: colors.coral,
    sun: colors.sun,
  }[tone];

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.55 : pressed ? 0.88 : 1 },
      ]}
    >
      <Text style={[styles.buttonLabel, tone === "sun" && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...input
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#B4A4C4"
        {...input}
        style={[styles.field, input.style]}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; emoji?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              tap();
              onChange(option.id);
            }}
            style={[styles.choice, active && styles.choiceOn]}
          >
            {option.emoji ? <Text style={styles.choiceEmoji}>{option.emoji}</Text> : null}
            <Text style={[styles.choiceLabel, active && styles.choiceLabelOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmojiRow({
  emojis,
  value,
  onChange,
}: {
  emojis: string[];
  value: string;
  onChange: (emoji: string) => void;
}) {
  return (
    <View style={styles.emojiWrap}>
      {emojis.map((emoji) => {
        const active = emoji === value;
        return (
          <Pressable
            key={emoji}
            onPress={() => {
              tap();
              onChange(emoji);
            }}
            style={[styles.emojiButton, active && styles.emojiOn]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ColorRow({
  colors: palette,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <View style={styles.emojiWrap}>
      {palette.map((color) => (
        <Pressable
          key={color}
          onPress={() => {
            tap();
            onChange(color);
          }}
          style={[
            styles.colorDot,
            { backgroundColor: color },
            value === color && styles.colorOn,
          ]}
        />
      ))}
    </View>
  );
}

export function MonthSwitcher() {
  const { month, setMonth } = useMonth();
  return (
    <View style={styles.month}>
      <Pressable
        onPress={() => {
          tap();
          setMonth(shiftMonth(month, -1));
        }}
        style={styles.monthArrow}
      >
        <Text style={styles.monthArrowText}>‹</Text>
      </Pressable>
      <Text style={styles.monthLabel}>{formatMonth(month)}</Text>
      <Pressable
        onPress={() => {
          tap();
          setMonth(shiftMonth(month, 1));
        }}
        style={styles.monthArrow}
      >
        <Text style={styles.monthArrowText}>›</Text>
      </Pressable>
    </View>
  );
}

export function Boot({ label = "Contando moedinhas..." }: { label?: string }) {
  return (
    <View style={styles.boot}>
      <Mascot emoji="🪙" size={108} />
      <Text style={styles.bootLabel}>{label}</Text>
    </View>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  coin: {
    backgroundColor: "#FFC857",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFE7A3",
    shadowColor: "#E39B12",
    shadowOpacity: 0.35,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shine: {
    position: "absolute",
    top: 8,
    left: 12,
    width: 16,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  bubble: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    ...shadow,
  },
  bubbleCopy: { flex: 1, gap: 4 },
  bubbleTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  bubbleBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  button: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonLabel: { color: "#FFF8EE", fontFamily: fonts.bodyStrong, fontSize: 17 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 14 },
  field: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  choiceOn: { backgroundColor: colors.ink },
  choiceEmoji: { fontSize: 16 },
  choiceLabel: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 14 },
  choiceLabelOn: { color: "#FFF6EA" },
  emojiWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOn: { backgroundColor: "#FFE08A", transform: [{ rotate: "-6deg" }] },
  emoji: { fontSize: 22 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorOn: { borderWidth: 3, borderColor: colors.ink },
  month: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 999,
    padding: 6,
    ...shadow,
  },
  monthArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.canvasDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowText: { fontSize: 28, color: colors.ink, marginTop: -4 },
  monthLabel: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, textTransform: "capitalize" },
  boot: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  bootLabel: { fontFamily: fonts.bodyStrong, color: colors.inkSoft, fontSize: 16 },
  error: { color: colors.coral, fontFamily: fonts.bodyStrong, fontSize: 14 },
});
