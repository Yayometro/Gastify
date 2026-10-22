import type { ImageSource } from 'expo-image';

// The logo image of each bank, by the bank's id (see @gastify/core/banks). A bank without an entry is drawn with its initials
// on its color. To add a logo: put the WebP (square, 256×256, transparent background) in `assets/banks/<id>.webp` and
// add its line here.
export const BANK_LOGOS: Record<string, ImageSource> = {};
