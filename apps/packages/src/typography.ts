export const fontFamily = "Plus Jakarta Sans" as const;

/**
 * Font-size scale (px).
 *
 * | token     | px  | use                          |
 * |-----------|-----|------------------------------|
 * | caption   | 12  | captions, fine print         |
 * | bodySmall | 14  | secondary body text          |
 * | body      | 16  | default body, inputs         |
 * | subtitle  | 20  | subtitles, section leads     |
 * | title     | 24  | section titles               |
 * | h2        | 32  | page-level headings          |
 * | h1        | 40  | hero / top-level headings    |
 */
export const fontSize = {
  caption: 12,
  bodySmall: 14,
  body: 16,
  subtitle: 20,
  title: 24,
  h2: 32,
  h1: 40,
} as const;

/**
 * Matching line-height scale (px).
 * Each value gives ~1.33–1.4x ratio to its font size.
 */
export const lineHeight = {
  caption: 16,
  bodySmall: 20,
  body: 24,
  subtitle: 28,
  title: 32,
  h2: 40,
  h1: 48,
} as const;

export const fontWeight = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const letterSpacing = {
  tight: 0.5,
  normal: 1,
  wide: 2,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type LineHeightToken = keyof typeof lineHeight;
export type FontWeightToken = keyof typeof fontWeight;
export type LetterSpacingToken = keyof typeof letterSpacing;
