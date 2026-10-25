import { useWindowDimensions } from 'react-native';

// Where the phone layout ends and the tablet (desktop-like, as the web) layout starts. The same width the side menu
// already uses, so the menu and the layouts always change together. Measuring the width, not asking "is this an iPad",
// also covers an iPad in a split window, Stage Manager, or a big phone turned sideways.
export const TABLET_MIN_WIDTH = 768;

// From here (an iPad turned sideways, or a big one) there is room for two columns of cards, as the web has at this width.
export const WIDE_MIN_WIDTH = 1000;

export type DeviceClass = 'phone' | 'tablet';

export function useDeviceClass(): DeviceClass {
  return useWindowDimensions().width >= TABLET_MIN_WIDTH ? 'tablet' : 'phone';
}

export function useIsTablet(): boolean {
  return useDeviceClass() === 'tablet';
}
