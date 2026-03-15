/**
 * Fixed component sizes — icons, buttons, inputs, avatars.
 * All values in px, derived from the 8px base grid.
 */
export const sizes = {
  iconSm: 16,
  iconMd: 24,
  iconLg: 32,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  inputHeightMd: 48,
  inputHeightLg: 56,
  avatarSm: 40,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 80,
} as const;

export type SizeToken = keyof typeof sizes;
