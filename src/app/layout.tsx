import type { Metadata, Viewport } from "next";
// Self-hosted fonts: no third-party font requests from the user's browser.
import "@fontsource-variable/inter";
import "@fontsource-variable/oswald";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glow — your personal enhancement plan",
  description: "Upload a selfie. Get a personalized, subtle glow-up plan with a realistic before and after — same you, just more refined.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0c0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
