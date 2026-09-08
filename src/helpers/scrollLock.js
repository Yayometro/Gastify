// Reference-counted body scroll lock, shared by every modal in the app.
//
// The earlier approach had each modal independently capture
// `document.body.style.overflow` on mount and restore that captured value
// on unmount. That breaks the moment two modals are open at once (a
// category picker opened from inside "Add Transaction", an edit modal
// opened from inside a drill-down, etc.): whichever one captures its
// "previous" value while the OTHER is already locked captures "hidden"
// instead of the real original value, so once both close, scroll never
// comes back - and because React 18 Strict Mode double-invokes every
// effect once in development (mount -> cleanup -> mount again), the same
// capture/restore mismatch can happen even for a single modal on its own.
//
// A shared counter sidesteps both problems: every modal that's currently
// open increments it on mount and decrements it on unmount, and the body
// is only ever unlocked (reset to a known-good "") once the count reaches
// zero - regardless of how many modals opened/closed, in what order, or
// how many times Strict Mode replays the effect.
let lockCount = 0;

export function lockBodyScroll() {
  lockCount += 1;
  document.body.style.overflow = "hidden";
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
  }
}
