import React from "react";

// The background of the dashboard, the same as the phone's: the mesh (already on .walllet-bg), three layers of darker
// purples that fade in as the page goes down (a scroll-driven fade where the browser supports it), and solid circles at
// 25 % opacity that drift a little with the scroll. It sits behind the content and takes no clicks.

const LAYERS: { cls: string; background: string }[] = [
  {
    cls: "gf-layer-1",
    background:
      "radial-gradient(circle at 94% 40%, rgba(107,33,168,0.4) 0%, transparent 55%), radial-gradient(circle at 6% 64%, rgba(74,4,78,0.42) 0%, transparent 50%)",
  },
  {
    cls: "gf-layer-2",
    background:
      "radial-gradient(circle at 20% 42%, rgba(59,7,100,0.5) 0%, transparent 56%), radial-gradient(circle at 98% 74%, rgba(30,27,75,0.5) 0%, transparent 46%)",
  },
  {
    cls: "gf-layer-3",
    background:
      "radial-gradient(circle at 50% 94%, rgba(88,28,135,0.45) 0%, transparent 62%), radial-gradient(circle at 4% 18%, rgba(46,16,101,0.5) 0%, transparent 44%), radial-gradient(circle at 96% 28%, rgba(192,132,252,0.07) 0%, transparent 30%)",
  },
];

// Left and top are in the viewport (vh), so the circles sit in different places as the page is read.
const CIRCLES: { color: string; left: string; top: string; size: number; speed: number }[] = [
  { color: "#7e22ce", left: "-6%", top: "8vh", size: 230, speed: 0.12 },
  { color: "#c026d3", left: "70%", top: "30vh", size: 160, speed: 0.18 },
  { color: "#4c1d95", left: "12%", top: "55vh", size: 280, speed: 0.1 },
  { color: "#a21caf", left: "64%", top: "75vh", size: 120, speed: 0.22 },
  { color: "#6d28d9", left: "-10%", top: "100vh", size: 260, speed: 0.14 },
  { color: "#e879f9", left: "72%", top: "115vh", size: 190, speed: 0.16 },
  { color: "#581c87", left: "50%", top: "140vh", size: 320, speed: 0.09 },
  { color: "#9333ea", left: "-4%", top: "160vh", size: 150, speed: 0.2 },
  { color: "#701a75", left: "68%", top: "190vh", size: 240, speed: 0.12 },
  { color: "#7c3aed", left: "20%", top: "210vh", size: 180, speed: 0.18 },
];

function DashboardBackdrop(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="gf-backdrop pointer-events-none">
      {LAYERS.map((layer) => (
        <div key={layer.cls} className={`gf-layer ${layer.cls} absolute inset-0`} style={{ backgroundImage: layer.background }} />
      ))}
      {CIRCLES.map((circle, index) => (
        <span
          key={index}
          className="gf-figure absolute rounded-full"
          style={{
            left: circle.left,
            top: circle.top,
            width: circle.size,
            height: circle.size,
            background: circle.color,
            opacity: 0.25,
            ["--speed" as string]: circle.speed,
          }}
        />
      ))}
    </div>
  );
}

export default DashboardBackdrop;
