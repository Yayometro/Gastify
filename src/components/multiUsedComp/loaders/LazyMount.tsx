"use client";

import React, { useEffect, useRef, useState } from "react";
import { Skeleton } from "antd";

export interface LazyMountProps {
  children: React.ReactNode;
  // Space reserved before mounting, so the page doesn't jump while scrolling.
  minHeight?: number;
  // How far below the viewport mounting starts (CSS margin syntax).
  rootMargin?: string;
  id?: string;
  className?: string;
}

// Mounts its children only when they come near the viewport, and keeps them
// mounted afterwards. The dashboard has many widgets that each process the whole
// movement list; rendering only the visible ones first makes the page usable
// sooner. Without IntersectionObserver it mounts right away.
function LazyMount({ children, minHeight = 320, rootMargin = "600px 0px", id, className }: LazyMountProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} id={id} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : <Skeleton active paragraph={{ rows: 4 }} className="p-4" />}
    </div>
  );
}

export default LazyMount;
