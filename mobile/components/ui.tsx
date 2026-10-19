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
import { TOUCH_MIN, radius, statusTone, theme, type } from "../lib/theme";
import { orderStatusLabel } from "../lib/types";

/**
 * Bottom padding for a scrolling screen.
 *
 * Android runs edge-to-edge, so the gesture bar sits *over* the app rather
 * than beside it. A fixed paddingBottom leaves the last row half-swallowed by
 * it; adding the inset keeps the final one reachable on every device.
 */
export function useBottomInset(base = 32): number {
  return base + useSafeAreaInsets().bottom;
}

/** A white panel on the canvas. Hairline border, no shadow. */
export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

/** Kept for screens still calling it; a Card is just a Panel now. */
export const Card = Panel;

/**
 * A small label above a value. Sentence case, in muted ink — the app used to
 * set these in tracked-out capitals, which shouted every field name at a
 * reader who already knows what they are looking at.
 */
export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Older name for the same thing. */
export const Eyebrow = Label;

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/** Order status: a coloured dot and the word, inline with the row. */
export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? { dot: theme.inkMuted, label: theme.inkMuted };
  return (
    <View style={styles.status}>
      <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.statusText, { color: tone.label }]}>{orderStatusLabel(status)}</Text>
    </View>
  );
}

export function Tag({ label, tone = "muted" }: { label: string; tone?: "muted" | "accent" }) {
  const accent = tone === "accent";
  return (
    <View style={[styles.tag, accent && { backgroundColor: theme.blueWash }]}>
      <Text style={[styles.tagText, accent && { color: theme.blueDeep }]}>{label}</Text>
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
        style,
      ]}
    >
      {/* The label stays mounted under the spinner so the button keeps its
          width and the row never reflows mid-save. */}
      <Text
        style={[
          styles.buttonText,
          isSolid ? { color: theme.white } : { color: isDanger ? theme.danger : theme.blue },
          loading && styles.buttonTextHidden,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          color={isSolid ? theme.white : isDanger ? theme.danger : theme.blue}
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
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
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
      {label ? <Label>{label}</Label> : null}
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
  const bad = tone === "error";
  return (
    <View style={[styles.message, bad && { backgroundColor: theme.dangerWash }]}>
      <Text style={[styles.messageText, bad && { color: theme.danger }]}>{children}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.blue} />
    </View>
  );
}

/** A hairline between rows, inset past a leading image or avatar. */
export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.surface,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: theme.line,
  },
  label: { ...type.label, color: theme.inkMuted },
  title: { ...type.screenTitle, color: theme.ink },
  sectionTitle: { ...type.sectionTitle, color: theme.ink },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { ...type.meta },
  tag: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: theme.canvas,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, color: theme.inkMuted },
  button: {
    minHeight: TOUCH_MIN,
    borderRadius: radius.field,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSolid: { backgroundColor: theme.blue },
  buttonOutline: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line },
  // Destructive actions used to render identically to a plain outline button,
  // so "Supprimer" looked like any other secondary choice.
  buttonDanger: { backgroundColor: theme.dangerWash, borderColor: theme.danger },
  buttonDisabled: { opacity: 0.45 },
  buttonSolidPressed: { backgroundColor: theme.blueDeep },
  buttonOutlinePressed: { backgroundColor: theme.canvas },
  buttonText: { ...type.bodyStrong },
  buttonTextHidden: { opacity: 0 },
  chip: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: theme.blue, borderColor: theme.blue },
  chipPressed: { backgroundColor: theme.canvas },
  chipText: { ...type.meta, color: theme.inkSoft },
  chipTextActive: { color: theme.white, fontWeight: "600" },
  field: { marginBottom: 16 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: radius.field,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.ink,
  },
  inputMultiline: { minHeight: 92, textAlignVertical: "top" },
  hint: { marginTop: 5, ...type.meta, color: theme.inkMuted },
  toggleRow: { flexDirection: "row", alignItems: "center", minHeight: TOUCH_MIN, paddingVertical: 10 },
  togglePressed: { opacity: 0.6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: theme.blue, borderColor: theme.blue },
  checkmark: { color: theme.white, fontSize: 13, lineHeight: 16 },
  toggleLabel: { ...type.body, color: theme.ink },
  message: {
    backgroundColor: theme.canvas,
    borderRadius: radius.field,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  messageText: { ...type.meta, color: theme.inkSoft, lineHeight: 19 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  divider: { height: 1, backgroundColor: theme.lineSoft },
});
