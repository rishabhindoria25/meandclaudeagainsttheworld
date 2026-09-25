export type TemplateId = "editorial" | "clinical" | "noir" | "sage";

export interface ReportTheme {
  id: TemplateId;
  name: string;
  bg: string;
  panel: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  band: string; // footer band background
  bandInk: string;
  badgeBg: string;
  badgeInk: string;
  titleFont: string;
  titleCase: "uppercase" | "none";
  titleWeight: number;
  titleSize: number;
  headFont: string;
  headCase: "uppercase" | "none";
  headTracking: string;
  bodyFont: string;
}

const serif = "var(--font-cormorant), Georgia, serif";
const sans = "var(--font-inter), system-ui, sans-serif";
const condensed = "var(--font-oswald), 'Arial Narrow', sans-serif";

export const THEMES: Record<TemplateId, ReportTheme> = {
  editorial: {
    id: "editorial",
    name: "Editorial",
    bg: "#f6f1ea",
    panel: "#fbf8f3",
    ink: "#221e1a",
    muted: "#6e6259",
    line: "#ddd3c6",
    accent: "#8b6a4f",
    band: "#efe7dc",
    bandInk: "#221e1a",
    badgeBg: "#fbf8f3",
    badgeInk: "#221e1a",
    titleFont: serif,
    titleCase: "none",
    titleWeight: 500,
    titleSize: 54,
    headFont: sans,
    headCase: "uppercase",
    headTracking: "0.18em",
    bodyFont: sans,
  },
  clinical: {
    id: "clinical",
    name: "Clinical",
    bg: "#ffffff",
    panel: "#ffffff",
    ink: "#111111",
    muted: "#4b4b4b",
    line: "#1a1a1a",
    accent: "#111111",
    band: "#f3f3f3",
    bandInk: "#111111",
    badgeBg: "#111111",
    badgeInk: "#ffffff",
    titleFont: condensed,
    titleCase: "uppercase",
    titleWeight: 600,
    titleSize: 46,
    headFont: condensed,
    headCase: "uppercase",
    headTracking: "0.04em",
    bodyFont: sans,
  },
  noir: {
    id: "noir",
    name: "Noir",
    bg: "#151515",
    panel: "#f5f3f0",
    ink: "#f2f0ed",
    muted: "#b3aea8",
    line: "#3a3a3a",
    accent: "#f2f0ed",
    band: "#1f1f1f",
    bandInk: "#f2f0ed",
    badgeBg: "#151515",
    badgeInk: "#f2f0ed",
    titleFont: sans,
    titleCase: "uppercase",
    titleWeight: 400,
    titleSize: 34,
    headFont: sans,
    headCase: "uppercase",
    headTracking: "0.24em",
    bodyFont: sans,
  },
  sage: {
    id: "sage",
    name: "Sage",
    bg: "#f3f0e8",
    panel: "#faf8f3",
    ink: "#1f2a22",
    muted: "#5d6a60",
    line: "#d5d9cf",
    accent: "#2f4a38",
    band: "#2f4a38",
    bandInk: "#f3f0e8",
    badgeBg: "#2f4a38",
    badgeInk: "#f3f0e8",
    titleFont: serif,
    titleCase: "uppercase",
    titleWeight: 500,
    titleSize: 44,
    headFont: serif,
    headCase: "uppercase",
    headTracking: "0.12em",
    bodyFont: sans,
  },
};
