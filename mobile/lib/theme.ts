import type { TextStyle } from "react-native";

/**
 * The admin app is a tool, not a shopfront.
 *
 * It gets used standing up, one-handed, between other things — so the screen
 * is white, the type is compact, and the one saturated colour is the blue from
 * the DM mark, spent only on what the shop owner acts on: the header they are
 * in, the active tab, the button that commits.
 *
 * The storefront's cream and serif stay on the storefront. Dressing a work
 * tool in them made every screen a floating card on a pale wash.
 */
export const theme = {
  /** Surfaces. `canvas` is behind lists, `surface` is the list itself. */
  surface: "#FFFFFF",
  canvas: "#F6F7F9",
  /** The mark's blue. Headers, the active tab, the committing button. */
  blue: "#1D4ED8",
  blueDeep: "#1A3FAE",
  /** Row selection and quiet blue fills. */
  blueWash: "#EEF3FF",
  ink: "#101828",
  inkSoft: "#475467",
  inkMuted: "#667085",
  line: "#E3E8EF",
  lineSoft: "#EFF2F6",
  white: "#FFFFFF",
  /** Destructive actions — deleting a line, cancelling an order. */
  danger: "#B42318",
  dangerWash: "#FEF3F2",
  /** Money in, order delivered. */
  good: "#067647",
} as const;

export const radius = {
  /** Panels and inputs share one radius; pills are for status only. */
  panel: 14,
  field: 12,
  pill: 999,
} as const;

export const spacing = {
  screen: 16,
  gap: 12,
} as const;

/**
 * Smallest comfortable tap target. Android's own guidance is 48dp; anything
 * under it is a button you have to aim at, which is the wrong thing to ask of
 * someone packing orders one-handed.
 */
export const TOUCH_MIN = 48;

/**
 * Type scale. Two sizes carry the app — 15 for everything readable, 13 for
 * what supports it — with weight and colour doing the rest. Order numbers and
 * money are tabular so columns line up down a list.
 */
export const type = {
  screenTitle: { fontSize: 22, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyStrong: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 13, fontWeight: "400" },
  label: { fontSize: 13, fontWeight: "500" },
  mono: { fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"] },
} satisfies Record<string, TextStyle>;

/**
 * Order status as a dot and a word. The old version filled a pill per status,
 * which turned a list of orders into a row of competing colours; the work is
 * reading the list, not the badges.
 */
export const statusTone: Record<string, { dot: string; label: string }> = {
  pending: { dot: "#F79009", label: theme.inkSoft },
  confirmed: { dot: theme.blue, label: theme.inkSoft },
  ready: { dot: "#7A5AF8", label: theme.inkSoft },
  shipped: { dot: "#0BA5EC", label: theme.inkSoft },
  delivered: { dot: theme.good, label: theme.inkSoft },
  cancelled: { dot: theme.inkMuted, label: theme.inkMuted },
};
