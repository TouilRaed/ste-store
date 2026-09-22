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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOUCH_MIN, cardShadow, radius, statusTone, theme } from "../lib/theme";
import { orderStatusLabel } from "../lib/types";

/**
 * Bottom padding for a scrolling screen.
 *
 * Android runs edge-to-edge, so the gesture bar sits *over* the app rather
 * than beside it. A fixed paddingBottom leaves the last card half-swallowed by
 * it; adding the inset keeps the final row reachable on every device.
 */
export function useBottomInset(base = 40): number {
  return base + useSafeAreaInsets().bottom;
}

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
      <Text style={[styles.badgeText, { color: tone.fg }]}>{orderStatusLabel(status)}</Text>
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
  const isDanger = variant === "danger";
  const busy = Boolean(disabled || loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.button,
        isSolid ? styles.buttonSolid : styles.buttonOutline,
        isDanger && styles.buttonDanger,
        busy && styles.buttonDisabled,
        pressed && (isSolid ? styles.buttonSolidPressed : styles.buttonOutlinePressed),
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {/* The label stays mounted under the spinner so the button keeps its
          width and the row never reflows mid-save. */}
      <Text
        style={[
          styles.buttonText,
          isSolid ? { color: theme.white } : { color: isDanger ? theme.danger : theme.accent },
          loading && styles.buttonTextHidden,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          color={isSolid ? theme.white : isDanger ? theme.danger : theme.accent}
        />
      ) : null}
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
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
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
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [styles.toggleRow, pressed && styles.togglePressed]}
    >
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
    minHeight: TOUCH_MIN,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSolid: { backgroundColor: theme.accent },
  buttonOutline: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.lineStrong },
  // Destructive actions used to render identically to a plain outline button,
  // so "Supprimer" looked like any other secondary choice.
  buttonDanger: { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { transform: [{ scale: 0.98 }] },
  buttonSolidPressed: { backgroundColor: theme.accentDeep },
  buttonOutlinePressed: { backgroundColor: theme.paperDeep },
  buttonText: { fontSize: 16, fontWeight: "500" },
  buttonTextHidden: { opacity: 0 },
  chip: {
    minHeight: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.lineStrong,
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText: { fontSize: 14, color: theme.inkSoft, textTransform: "capitalize" },
  chipTextActive: { color: theme.white, fontWeight: "600" },
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
  toggleRow: { flexDirection: "row", alignItems: "center", minHeight: TOUCH_MIN, paddingVertical: 12 },
  togglePressed: { opacity: 0.6 },
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
