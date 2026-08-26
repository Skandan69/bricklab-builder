import type { Metadata } from "next";
import "./globals.css";
import "./studio.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bricklab-builder.asd123456987.chatgpt.site"),
  title: "BrickLab Builder",
  description: "Build dream cities piece by piece, then walk, ride and play through modern and heritage showcase worlds.",
  openGraph: { title: "BrickLab Builder", description: "Build dream cities, explore working showcase worlds and copy every piece into a town of your own.", type: "website", images: [{url:"/og.png",width:1731,height:909,alt:"BrickLab Builder — turn simple bricks into big ideas"}] },
  twitter: { card: "summary_large_image", title: "BrickLab Builder", description: "Build dream cities and explore modern and heritage showcase worlds.", images:["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return (
    <html lang="en">
      <head>
        {/* Space Grotesk carries the display type, Inter the interface text.
            Linked rather than bundled so a font outage cannot fail a build. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
        <meta name="theme-color" content="#07080b" />
      </head>
      <body>
        {children}
        {/* the same widget the standalone games load, so feedback arrives in one place */}
        {/* the challenge scorer, shared by the page and anything else that needs
            to compare two builds */}
        <script src="/challenge-score.js" defer />
        <script src="/feedback.js" defer />
      </body>
    </html>
  ); }
