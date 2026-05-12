import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Guess the Crowd",
  description: "Predict what most people will answer. 5 questions, every day.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fff8ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-ink">
        <main className="mx-auto max-w-md min-h-dvh px-5 pt-6 pb-12">{children}</main>
      </body>
    </html>
  );
}
