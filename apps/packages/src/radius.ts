/**
 * Border-radius tokens — multiples of 8.
 *
 * | token | px   | use                            |
 * |-------|------|--------------------------------|
 * | sm    |  8   | small cards, tags              |
 * | md    | 16   | inputs, buttons, chat bubbles  |
 * | lg    | 24   | cards, modals                  |
 * | pill  | 999  | pill badges, full-round caps   |
 */
export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
