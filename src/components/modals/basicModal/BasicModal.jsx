"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CategoIcon from "@/components/multiUsedComp/CategoIcon";
import { lockBodyScroll, unlockBodyScroll } from "@/helpers/scrollLock";

// Navbar.jsx's own <ul> surfaces sit at z-[1001]/z-[1002] (so the mobile
// bottom nav stays above scrolled page content) - a modal backdrop at the
// old default of z-[1000] rendered BELOW that, leaving the navbar fully
// clickable/interactive through the "open" modal. Clicking a nav icon while
// a modal was open then closed the modal via a completely different code
// path than its own close button, which is how it left document.body's
// scroll-lock stuck on "hidden" instead of being restored. Comfortably
// above every navbar z-index fixes both the click-through and the stuck
// scroll lock it caused.
function BasicModal({ close, renderContent, renderBodyContent, renderHeader, zIndexClass = "z-[5000]" }) {
  // Every glass-card container uses backdrop-filter, which - per spec, same
  // as transform/filter/perspective - makes that ancestor a new containing
  // block for `position: fixed` descendants. A modal rendered inline inside
  // one of those cards was never actually fixed to the viewport: it was
  // "fixed" relative to that card's own box, and stacked only within that
  // card's own local stacking context - explaining both the modal
  // rendering behind later glass cards, and it appearing mispositioned
  // with the page still scrolling behind it. Porting straight to
  // document.body escapes every such ancestor.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock page scroll while the modal is open - otherwise the page behind it
  // keeps scrolling, which reads as broken once the modal is truly
  // viewport-fixed (see the portal above) rather than confined to some
  // ancestor's box.
  useEffect(() => {
    if (!close) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [close]);

  if (!close || !mounted) return null;

  return createPortal(
    <div className={`fixed w-screen h-screen top-0 left-0 flex justify-center items-center ${zIndexClass} overflow-x-hidden`}>
      <div
        className={`w-screen h-screen bg-black/50 backdrop-blur-md`}
        onClick={close}
      ></div>
      {renderContent || (
        <div className="content absolute gf-glass-violet flex flex-col w-full h-full max-w-[500px] max-h-[90%] rounded-2xl items-center justify-center overflow-hidden z-[5001]">
          {renderHeader}
          {renderBodyContent}
          <button onClick={close}>
            <div className="close-con absolute top-[0%] right-[0%] rounded-full gf-glass-card p-1.5 text-purple-100 hover:text-white transition-colors m-2 pulse-animation-short z-[100]">
              <CategoIcon type={"MdClose"} siz={20} />
            </div>
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

export default BasicModal;
