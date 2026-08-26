/** Mirrors the web palette in src/app/globals.css. */
export const theme = {
  paper: "#FFFFFF",
  paperDeep: "#F3F6FC",
  paperSand: "#E6EDFA",
  ink: "#0D1526",
  inkSoft: "#3D4A63",
  inkMuted: "#74809A",
  accent: "#1D4ED8",
  accentDeep: "#1A3FAE",
  accentSoft: "#E8EFFD",
  sage: "#2F7A5A",
  line: "rgba(13,21,38,0.10)",
  lineStrong: "rgba(13,21,38,0.18)",
  white: "#FFFFFF",
} as const;

export const radius = {
  card: 18,
  field: 16,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
  gap: 16,
} as const;

/** Soft, diffused shadow — never a hard dark drop. */
export const cardShadow = {
  boxShadow: "0px 12px 28px rgba(13, 21, 38, 0.08)",
  elevation: 2,
} as const;

export const statusTone: Record<string, { bg: string; fg: string }> = {
  pending: { bg: theme.accentSoft, fg: theme.accentDeep },
  confirmed: { bg: "#E4F1EA", fg: theme.sage },
  ready: { bg: "#EFE9DD", fg: "#7A6741" },
  shipped: { bg: "#DDE7FA", fg: theme.accentDeep },
  delivered: { bg: theme.accent, fg: "#FFFFFF" },
  cancelled: { bg: theme.paperSand, fg: theme.inkMuted },
};
