"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { IoClose } from "react-icons/io5";
import BasicModal from "@/components/modals/basicModal/BasicModal";
import type { BudgetAlert } from "@gastify/core/budgets/budgetAlerts";
import { alertMood, type AlertMood } from "@gastify/core/budgets/alertMood";

// The window of a notice, the same as the app's: a celebration (confetti and fireworks) for a goal reached, an alarm
// (the edges of the screen pulse) for 70 to 90 %, and a fire (flames rise) past the limit. It stays until it is closed.
const COLORS = ["#f472b6", "#c084fc", "#60a5fa", "#34d399", "#fbbf24", "#fb7185", "#ffffff"];
const ALARM_COLOR: Record<AlertMood, string> = { celebrate: "#c084fc", alarm: "#f43f5e", fire: "#f97316" };
const FIRE = ["🔥", "💥", "🔥", "✨", "🔥", "💥", "🔥"];

type Confetto = { x: number; y: number; size: number; color: string; speed: number; sway: number; spin: number; angle: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

// Confetti falling over the whole window and three fireworks bursting at different places, drawn on a canvas that takes
// no clicks.
function CelebrationCanvas(): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    let frame = 0;
    let raf = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const confetti: Confetto[] = Array.from({ length: 90 }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: -Math.random() * window.innerHeight,
      size: 6 + Math.random() * 8,
      color: COLORS[index % COLORS.length],
      speed: 1.4 + Math.random() * 1.8,
      sway: Math.random() * Math.PI * 2,
      spin: Math.random() * 0.2 - 0.1,
      angle: Math.random() * Math.PI,
    }));
    const sparks: Spark[] = [];
    const bursts = [
      { at: 200, x: 0.25, y: 0.28 },
      { at: 900, x: 0.75, y: 0.22 },
      { at: 1600, x: 0.5, y: 0.38 },
    ];
    const started = performance.now();
    const fired = new Set<number>();

    const tick = (now: number) => {
      const elapsed = now - started;
      context.clearRect(0, 0, canvas.width, canvas.height);
      frame += 1;
      for (const piece of confetti) {
        piece.y += piece.speed;
        piece.x += Math.sin(piece.sway + frame * 0.04) * 1.2;
        piece.angle += piece.spin;
        if (piece.y > canvas.height + 20) {
          piece.y = -20;
          piece.x = Math.random() * canvas.width;
        }
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size * 0.3, piece.size, piece.size * 0.6);
        context.restore();
      }
      bursts.forEach((burst, index) => {
        if (elapsed >= burst.at && !fired.has(index)) {
          fired.add(index);
          const cx = burst.x * canvas.width;
          const cy = burst.y * canvas.height;
          for (let i = 0; i < 26; i += 1) {
            const angle = (i / 26) * Math.PI * 2;
            const speed = 2 + Math.random() * 2.5;
            sparks.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color: COLORS[i % COLORS.length] });
          }
        }
      });
      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.04;
        spark.life -= 0.016;
        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        context.globalAlpha = Math.max(0, spark.life);
        context.fillStyle = spark.color;
        context.beginPath();
        context.arc(spark.x, spark.y, 2.6, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full" />;
}

// The fire of the 100 %: flames and bursts rise over the window again and again.
function FireLayer(): React.JSX.Element {
  const flames = Array.from({ length: 16 }, (_, index) => ({
    left: `${(index / 16) * 100 + Math.random() * 4}%`,
    size: 22 + Math.random() * 20,
    delay: Math.random() * 1.6,
    duration: 1.3 + Math.random() * 1.0,
    glyph: FIRE[index % FIRE.length],
  }));
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {flames.map((flame, index) => (
        <span
          key={index}
          className="gf-flame absolute bottom-[60px]"
          style={{ left: flame.left, fontSize: flame.size, animationDuration: `${flame.duration}s`, animationDelay: `${flame.delay}s` }}
        >
          {flame.glyph}
        </span>
      ))}
    </div>
  );
}

export interface AlertCelebrationProps {
  alert: BudgetAlert;
  onClose: () => void;
}

function AlertCelebration({ alert, onClose }: AlertCelebrationProps): React.JSX.Element {
  const mood = alertMood(alert);
  const emoji = mood === "fire" ? "🔥" : mood === "alarm" ? "😬" : "🎉";
  return (
    <BasicModal
      close={onClose}
      zIndexClass="z-[10020]"
      renderContent={
        <div className="fixed inset-0 z-[10020] flex items-center justify-center p-6" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          {mood === "celebrate" && <CelebrationCanvas />}
          {mood !== "celebrate" && (
            <div
              aria-hidden="true"
              className="gf-alarm pointer-events-none fixed inset-0"
              style={{
                border: `${mood === "fire" ? 18 : 14}px solid ${ALARM_COLOR[mood]}`,
                animationDuration: mood === "fire" ? "0.34s" : "0.92s",
              }}
            />
          )}
          {mood === "fire" && <FireLayer />}
          <div className="content gf-glass-violet animate__animated animate__zoomIn animate__faster relative z-[1] flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[28px] p-7 text-center">
            <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1 text-purple-100 transition-transform hover:scale-125 hover:text-white">
              <IoClose size={24} />
            </button>
            <span className="text-[56px] leading-none" aria-hidden="true">
              {emoji}
            </span>
            <h2 className="text-2xl font-bold text-white">{alert.title}</h2>
            <p className="text-base text-purple-100/90">{alert.message}</p>
            <Link href="/dashboard/budgets" onClick={onClose} className="gf-glass-button w-full rounded-full px-4 py-3 text-center font-semibold text-white">
              Ver mi presupuesto
            </Link>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-purple-200 hover:text-white">
              Cerrar
            </button>
          </div>
        </div>
      }
    />
  );
}

export default AlertCelebration;
