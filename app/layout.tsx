import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Loyola Finance Group",
  description: "Financiamiento directo para proyectos de construcción y mejoras del hogar en Texas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable, newsreader.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
