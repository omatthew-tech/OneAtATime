import { spacing } from "./spacing";
import { fontSize, lineHeight, fontFamily, fontWeight, letterSpacing } from "./typography";
import { radius } from "./radius";
import { sizes } from "./sizes";

export const tokens = {
  spacing,
  typography: fontSize,
  lineHeights: lineHeight,
  radius,
  sizes,
} as const;

export { spacing } from "./spacing";
export type { SpacingToken } from "./spacing";

export { fontSize, fontFamily, fontWeight, lineHeight, letterSpacing } from "./typography";
export type { FontSizeToken, LineHeightToken, FontWeightToken, LetterSpacingToken } from "./typography";

export { radius } from "./radius";
export type { RadiusToken } from "./radius";

export { sizes } from "./sizes";
export type { SizeToken } from "./sizes";

export { ocean, teal, coral, pearl, text, brand, colors } from "./colors";
export type { OceanToken, TealToken, TextToken, BrandToken } from "./colors";
