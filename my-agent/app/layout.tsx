import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Agentmaxx — Autonomous Agent Command Center",
  description: "Autonomous AI agent command center with cryptographic wallet, tool execution telemetry, and conversational commerce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark font-sans antialiased">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
