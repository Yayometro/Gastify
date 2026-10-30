import { ImageResponse } from "next/og";
import GastifyPwaArtwork from "./GastifyPwaArtwork";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<GastifyPwaArtwork size={size.width} />, size);
}
