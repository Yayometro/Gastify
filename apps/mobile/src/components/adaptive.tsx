import type { ReactNode } from 'react';

import { useDeviceClass } from '@/hooks/use-device-class';

// One place to say "this looks one way on the phone and another on the tablet". Only the matching side is mounted, so
// the phone never pays for (or shows) the tablet version. Both receive the same data, so the numbers can't differ.
export function Adaptive({ phone, tablet }: { phone: ReactNode; tablet?: ReactNode }) {
  const device = useDeviceClass();
  return <>{device === 'tablet' && tablet !== undefined ? tablet : phone}</>;
}
