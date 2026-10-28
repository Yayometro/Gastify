"use client";

import { useEffect } from "react";

// Measures the Core Web Vitals of a wallet page view and sends them to the admin panel once, when the page is left. Only a
// sample of the views is measured (a quarter), so the panel gets a fair picture without a write for every visit. Nothing about
// the page content is sent: a metric name and a number.
const SAMPLE_RATE = 0.25;
const ENDPOINT = "/api/admin/vitals";

interface MetricEntry {
  startTime: number;
  duration?: number;
  value?: number;
  hadRecentInput?: boolean;
  interactionId?: number;
}

export default function WebVitalsReporter(): null {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;
    if (Math.random() > SAMPLE_RATE) return;

    let lcp = 0;
    let cls = 0;
    // The slowest interaction of the page, from event timing (an approximation of INP).
    let inp = 0;

    const observers: PerformanceObserver[] = [];
    const observe = (type: string, options: PerformanceObserverInit, onEntries: (entries: MetricEntry[]) => void) => {
      try {
        const observer = new PerformanceObserver((list) => onEntries(list.getEntries() as unknown as MetricEntry[]));
        observer.observe({ type, buffered: true, ...options } as PerformanceObserverInit);
        observers.push(observer);
      } catch {
        // The browser does not know this entry type: that metric is simply not sent.
      }
    };

    observe("largest-contentful-paint", {}, (entries) => {
      const last = entries[entries.length - 1];
      if (last) lcp = last.startTime;
    });
    observe("layout-shift", {}, (entries) => {
      for (const entry of entries) {
        if (!entry.hadRecentInput) cls += entry.value ?? 0;
      }
    });
    observe("event", { durationThreshold: 40 } as PerformanceObserverInit, (entries) => {
      for (const entry of entries) {
        if (entry.interactionId) inp = Math.max(inp, entry.duration ?? 0);
      }
    });

    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      const beacon = (metric: string, value: number) => {
        if (!(value > 0)) return;
        const body = new Blob([JSON.stringify({ metric, value })], { type: "application/json" });
        navigator.sendBeacon?.(ENDPOINT, body);
      };
      beacon("LCP", lcp);
      beacon("INP", inp);
      // CLS is sent multiplied by 1000 so the server histogram keeps its precision.
      beacon("CLS", cls * 1000);
      observers.forEach((observer) => observer.disconnect());
    };

    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      // Leaving the wallet inside the app (a client-side navigation) does not hide the page, so the report goes out here too.
      document.removeEventListener("visibilitychange", onHide);
      send();
    };
  }, []);

  return null;
}
