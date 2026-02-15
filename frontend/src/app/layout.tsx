import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { LanguageProvider } from "@/context/language-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "emoDiary — Your Mental Health Companion",
  description:
    "A voice-enabled bilingual mental health companion that helps you reflect on your thoughts and feelings through journaling and empathetic AI conversations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased text-[#064e3b] bg-[#fefcfa]`}>
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}
