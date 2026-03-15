/** Deep-ocean background palette (darkest → lightest) */
export const ocean = {
  abyss: "#0a1628",
  deep: "#0f2744",
  mid: "#1a3a5c",
  surface: "#2d5a7b",
} as const;

/** Primary accent — teal */
export const teal = {
  glow: "#00d4aa",
  soft: "#4ecdc4",
} as const;

/** Secondary accent — coral */
export const coral = {
  accent: "#ff6b6b",
} as const;

/** Neutral light surfaces */
export const pearl = {
  white: "#f8f9fa",
  soft: "#e9ecef",
} as const;

/** Text colors */
export const text = {
  primary: "#ffffff",
  secondary: "rgba(255, 255, 255, 0.7)",
  muted: "rgba(255, 255, 255, 0.5)",
} as const;

/** Brand identity colors */
export const brand = {
  logo: "#ffffff",
  fish: "#ffffff",
} as const;

/** Convenience flat export of every color */
export const colors = {
  ...ocean,
  ...teal,
  ...coral,
  ...pearl,
  ...brand,
  textPrimary: text.primary,
  textSecondary: text.secondary,
  textMuted: text.muted,
} as const;

export type OceanToken = keyof typeof ocean;
export type TealToken = keyof typeof teal;
export type TextToken = keyof typeof text;
export type BrandToken = keyof typeof brand;
