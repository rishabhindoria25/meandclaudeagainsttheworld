// Builds artifact/glow.html: inlines self-hosted fonts (the artifact sandbox
// blocks font hosts other than Google Fonts, and html-to-image needs embedded
// fonts for a faithful PNG) and the example plan.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const fs = "node_modules/@fontsource";
const face = (family, file, weight, style = "normal") =>
  `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(file).toString("base64")}) format("woff2")}`;
const fonts = [
  face("Inter Glow", `${fs}-variable/inter/files/inter-latin-wght-normal.woff2`, "100 900"),
  face("Oswald Glow", `${fs}-variable/oswald/files/oswald-latin-wght-normal.woff2`, "200 700"),
  face("Cormorant Garamond", `${fs}/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2`, "400 500"),
  face("Cormorant Garamond", `${fs}/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2`, "600 700"),
  face("Cormorant Garamond", `${fs}/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2`, "400 700", "italic"),
].join("\n");

const demo = execFileSync("node", ["--experimental-strip-types", "--no-warnings", "-e",
  'import("./src/lib/demo-plan.ts").then(m=>process.stdout.write(JSON.stringify(m.DEMO_PLAN)))'], { encoding: "utf8" });

const src = readFileSync("artifact/glow.src.html", "utf8");
const out = src.replace("/*FONTS*/", () => fonts).replace("/*DEMO_PLAN*/null", () => demo);
writeFileSync("artifact/glow.html", out);
console.log(`artifact/glow.html ${(out.length / 1024).toFixed(0)} KB`);
