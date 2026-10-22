import type { ImageSource } from 'expo-image';

// The logo image of each bank, by the bank's id (see @gastify/core/banks). They are 256×256 WebP with a transparent background, the
// logo trimmed and centered, so they all read at the same size. A bank without an entry is drawn with its initials on its color.
// To add one: put `<id>.webp` in `assets/banks/` (and `public/banks/` for the web) and add its line here.
export const BANK_LOGOS: Record<string, ImageSource> = {
  actinver: require('../../assets/banks/actinver.webp'),
  afirme: require('../../assets/banks/afirme.webp'),
  azteca: require('../../assets/banks/azteca.webp'),
  bajio: require('../../assets/banks/bajio.webp'),
  banamex: require('../../assets/banks/banamex.webp'),
  bancoppel: require('../../assets/banks/bancoppel.webp'),
  banorte: require('../../assets/banks/banorte.webp'),
  banregio: require('../../assets/banks/banregio.webp'),
  bbva: require('../../assets/banks/bbva.webp'),
  bienestar: require('../../assets/banks/bienestar.webp'),
  compartamos: require('../../assets/banks/compartamos.webp'),
  hey: require('../../assets/banks/hey.webp'),
  hsbc: require('../../assets/banks/hsbc.webp'),
  inbursa: require('../../assets/banks/inbursa.webp'),
  intercam: require('../../assets/banks/intercam.webp'),
  mifel: require('../../assets/banks/mifel.webp'),
  monex: require('../../assets/banks/monex.webp'),
  multiva: require('../../assets/banks/multiva.webp'),
  nu: require('../../assets/banks/nu.webp'),
  openbank: require('../../assets/banks/openbank.webp'),
  revolut: require('../../assets/banks/revolut.webp'),
  santander: require('../../assets/banks/santander.webp'),
  scotiabank: require('../../assets/banks/scotiabank.webp'),
  stori: require('../../assets/banks/stori.webp'),
  uala: require('../../assets/banks/uala.webp'),
  vepormas: require('../../assets/banks/vepormas.webp'),
};
