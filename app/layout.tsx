import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        {children}
        {/* the same widget the standalone games load, so feedback arrives in one place */}
        <script src="/feedback.js" defer />
      </body>
    </html>
  ); }
