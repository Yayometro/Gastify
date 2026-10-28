"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { IoCheckmarkDoneOutline, IoClose, IoPieChartOutline, IoTrendingUpOutline, IoWalletOutline } from "react-icons/io5";
import Navbar from "@/components/Navbar";
import DemoCreateModal from "@/components/demo/DemoCreateModal";
import { useT } from "@/i18n/client";
import { lockBodyScroll, unlockBodyScroll } from "@/helpers/scrollLock";

const sampleNotifications = [
  { id: "budget-80", title: "shared.demo.notification.budget80.title", body: "shared.demo.notification.budget80.body", time: "shared.demo.notification.time.now", href: "/demo/budgets", tone: "warning", icon: IoPieChartOutline },
  { id: "over-budget", title: "shared.demo.notification.overBudget.title", body: "shared.demo.notification.overBudget.body", time: "shared.demo.notification.time.hour", href: "/demo/budgets", tone: "danger", icon: IoWalletOutline },
  { id: "saving-progress", title: "shared.demo.notification.saving.title", body: "shared.demo.notification.saving.body", time: "shared.demo.notification.time.yesterday", href: "/demo/budgets", tone: "success", icon: IoTrendingUpOutline },
] as const;

/** The demo uses the real Gastify nav component, but swaps every route/action for a local, read-only equivalent. */
export default function DemoNavigation() {
  const t = useT();
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const notificationsDialogRef = useRef<HTMLElement>(null);
  const closeNotificationButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const unreadCount = sampleNotifications.length - readNotificationIds.length;
  const openCreate = useCallback(() => setCreateOpen(true), []);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const toggleTheme = useCallback(() => {
    setThemeMode((mode) => {
      const next = mode === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);
  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const markAllNotificationsRead = useCallback(() => setReadNotificationIds(sampleNotifications.map(({ id }) => id)), []);

  useEffect(() => {
    if (!notificationsOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockBodyScroll();
    const focusFrame = requestAnimationFrame(() => closeNotificationButtonRef.current?.focus());
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeNotifications();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
      unlockBodyScroll();
      previousFocusRef.current?.focus();
    };
  }, [closeNotifications, notificationsOpen]);

  function trapNotificationFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !notificationsDialogRef.current) return;
    const focusable = Array.from(notificationsDialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <Navbar
        demoMode
        demoThemeMode={themeMode}
        onDemoCreate={openCreate}
        onDemoNotifications={openNotifications}
        onDemoThemeToggle={toggleTheme}
        demoNotificationCount={unreadCount}
      />
      {createOpen && <DemoCreateModal onClose={closeCreate} />}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-[12000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeNotifications(); }}
        >
          <section ref={notificationsDialogRef} onKeyDown={trapNotificationFocus} className="gf-glass-violet max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-rose-200/20 p-5 text-gf-text shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="demo-notifications-title" tabIndex={-1}>
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="demo-notifications-title" className="text-xl font-semibold">{t("navbar.notifications")}</h2>
                <span className="mt-2 inline-flex rounded-full border border-rose-200/20 bg-rose-300/10 px-2.5 py-1 text-[10px] font-medium text-rose-100">{t("shared.demo.notificationExample")}</span>
              </div>
              <button ref={closeNotificationButtonRef} type="button" aria-label={t("shared.cancel")} onClick={closeNotifications} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-purple-100 transition hover:bg-white/10">
                <IoClose size={19} aria-hidden="true" />
              </button>
            </header>
            <p className="mt-4 rounded-xl border border-rose-200/20 bg-rose-950/30 px-3 py-2.5 text-xs leading-relaxed text-rose-100/90">{t("shared.demo.notificationPreview")}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-purple-50">{t("navbar.notifications")} <span className="font-normal text-purple-100/60">· {unreadCount}</span></p>
              <button type="button" disabled={unreadCount === 0} onClick={markAllNotificationsRead} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-purple-100/80 transition hover:bg-white/5 hover:text-white disabled:cursor-default disabled:opacity-40">
                <IoCheckmarkDoneOutline size={15} aria-hidden="true" />{t("shared.demo.markAllRead")}
              </button>
            </div>
            <ul className="mt-2 grid gap-2" aria-label={t("navbar.notifications")}>
              {sampleNotifications.map((notification) => {
                const Icon = notification.icon;
                const unread = !readNotificationIds.includes(notification.id);
                const toneClass = notification.tone === "danger"
                  ? "border-rose-200/20 bg-rose-400/10 text-rose-200"
                  : notification.tone === "warning"
                    ? "border-amber-200/20 bg-amber-300/10 text-amber-200"
                    : "border-emerald-200/20 bg-emerald-300/10 text-emerald-200";
                return (
                  <li key={notification.id}>
                    <Link
                      href={notification.href}
                      onClick={() => {
                        setReadNotificationIds((current) => current.includes(notification.id) ? current : [...current, notification.id]);
                        closeNotifications();
                      }}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 transition hover:bg-white/[.07] ${unread ? "border-white/10 bg-white/[.035]" : "border-white/[.06] bg-black/10 opacity-75"}`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${toneClass}`}><Icon size={18} aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <strong className="text-xs font-semibold text-white">{t(notification.title)}</strong>
                          <span className="shrink-0 text-[9px] text-purple-100/55">{t(notification.time)}</span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-purple-100/75">{t(notification.body)}</span>
                        <span className="mt-2 inline-flex rounded-full border border-rose-200/15 bg-rose-300/[.07] px-2 py-0.5 text-[9px] text-rose-100/80">{t("shared.demo.notificationExample")}</span>
                      </span>
                      {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-300" aria-hidden="true" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={closeNotifications} className="gf-glass-button mt-5 w-full rounded-xl px-4 py-2.5 text-sm">
              {t("shared.cancel")}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
