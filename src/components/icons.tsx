import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const Icon = {
  upload: (p: P) => (<svg {...base(p)}><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>),
  camera: (p: P) => (<svg {...base(p)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>),
  sparkle: (p: P) => (<svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" /></svg>),
  scissors: (p: P) => (<svg {...base(p)}><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8 8.5 20 17M8 15.5 20 7" /></svg>),
  droplet: (p: P) => (<svg {...base(p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>),
  sun: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>),
  brush: (p: P) => (<svg {...base(p)}><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z" /><path d="M4 20l2.5-2.5" /></svg>),
  moon: (p: P) => (<svg {...base(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>),
  water: (p: P) => (<svg {...base(p)}><path d="M7 4h10l-1 16H8z" /><path d="M7.5 10h9" /></svg>),
  leaf: (p: P) => (<svg {...base(p)}><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19 14 10" /></svg>),
  download: (p: P) => (<svg {...base(p)}><path d="M12 4v12m0 0-4-4m4 4 4-4" /><path d="M4 20h16" /></svg>),
  share: (p: P) => (<svg {...base(p)}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></svg>),
  back: (p: P) => (<svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>),
  check: (p: P) => (<svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>),
  close: (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  refresh: (p: P) => (<svg {...base(p)}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>),
  shield: (p: P) => (<svg {...base(p)}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>),
  info: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>),
};

export type TipIcon = "scissors" | "droplet" | "sun" | "brush" | "moon" | "water" | "sparkle" | "leaf";
export function TipGlyph({ name, ...p }: { name: TipIcon } & P) {
  const C = Icon[name] ?? Icon.sparkle;
  return <C {...p} />;
}
