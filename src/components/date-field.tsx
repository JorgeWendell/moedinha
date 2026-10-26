import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { formatLongDate, localISODate } from "@/src/domain/month";
import { colors, fonts } from "@/src/theme";

function toDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(Platform.OS === "web");

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS !== "web" ? (
        <Pressable onPress={() => setOpen(true)} style={styles.button}>
          <Text style={styles.value}>{formatLongDate(value)}</Text>
        </Pressable>
      ) : null}
      {open ? (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, selected) => {
            if (Platform.OS !== "ios") setOpen(false);
            if (selected) onChange(localISODate(selected));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: fonts.bodyStrong, color: colors.ink, fontSize: 14 },
  button: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
