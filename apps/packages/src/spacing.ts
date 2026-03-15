/**
 * Spacing scale — base unit 8px, multiples of 8 with a few 4px half-steps.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
  hero: 80,
} as const;

export type SpacingToken = keyof typeof spacing;
