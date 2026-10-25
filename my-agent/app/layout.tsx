import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { BazaarCursor } from "@/components/ui/bazaar-cursor";

export const metadata = {
  title: "Marzban — Autonomous Merchant Bazaar & Web3 Agent",
  description: "Autonomous AI merchant stall and command center with cryptographic wallet, tool execution telemetry, and conversational commerce on Base Sepolia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark font-sans antialiased">
      <body>
        <BazaarCursor />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
