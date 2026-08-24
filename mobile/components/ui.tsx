import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { cardShadow, radius, statusTone, theme } from "../lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? { bg: theme.paperSand, fg: theme.inkMuted };
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

export function Tag({ label, tone = "muted" }: { label: string; tone?: "muted" | "accent" }) {
  const palette =
    tone === "accent"
      ? { bg: theme.accentSoft, fg: theme.accentDeep }
      : { bg: theme.paperSand, fg: theme.inkMuted };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "solid",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "solid" | "outline" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isSolid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSolid ? styles.buttonSolid : styles.buttonOutline,
        variant === "danger" && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSolid ? "#FFFFFF" : theme.accent} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isSolid ? { color: "#FFFFFF" } : { color: variant === "danger" ? theme.accentDeep : theme.accent },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.chipText, active && { color: theme.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        placeholderTextColor={theme.inkMuted}
        {...props}
        style={[styles.input, props.multiline && styles.inputMultiline, props.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

export function Message({ tone = "info", children }: { tone?: "info" | "error"; children: ReactNode }) {
  return (
    <View style={[styles.message, tone === "error" && { backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.messageText, tone === "error" && { color: theme.accentDeep }]}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: theme.line,
    ...cardShadow,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: theme.inkMuted,
    fontWeight: "500",
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: theme.ink,
    marginTop: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSolid: { backgroundColor: theme.accent },
  buttonOutline: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.lineStrong },
  buttonDanger: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.lineStrong },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonText: { fontSize: 16, fontWeight: "500" },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    backgroundColor: theme.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { fontSize: 14, color: theme.inkSoft, textTransform: "capitalize" },
  field: { marginBottom: 18 },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    borderRadius: radius.field,
    backgroundColor: theme.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.ink,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: "top" },
  hint: { marginTop: 6, fontSize: 11, color: theme.inkMuted },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { color: theme.paper, fontSize: 13, lineHeight: 16 },
  toggleLabel: { fontSize: 15, color: theme.ink },
  message: {
    backgroundColor: theme.paperDeep,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  messageText: { fontSize: 13, color: theme.inkSoft, lineHeight: 19 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 },
});
