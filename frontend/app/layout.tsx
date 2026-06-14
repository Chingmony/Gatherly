import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

// Design handoff typography: Plus Jakarta Sans (UI) + DM Mono (numeric/code).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gatherly",
  description: "Event Coordination Platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${dmMono.variable}`}>
      <head>
        {/* Apply the persisted theme before first paint to avoid a light→dark flash (design: theme
            toggle persists to localStorage `gatherly-theme`, sets data-theme="dark" on <html>). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('gatherly-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
