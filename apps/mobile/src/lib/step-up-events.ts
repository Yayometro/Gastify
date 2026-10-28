import type { StepUpReason } from '@gastify/core/auth/sessionStatus';

// The API client reports a refused session here (configureApi in store.ts). The session hook listens and re-reads the session
// status at once, so the verification screen shows with the reason instead of a failed load.
type Listener = (reason: StepUpReason) => void;

const listeners = new Set<Listener>();

export function reportStepUp(reason: StepUpReason): void {
  listeners.forEach((listener) => listener(reason));
}

export function onStepUp(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
