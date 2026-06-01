import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Let Me Hear You",
  description:
    "Komunitas kesehatan mental — skrining mandiri, pelacakan mood, dan alat relaksasi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png?v=3",
    shortcut: "/icon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${poppins.variable} min-h-screen antialiased`}>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PZ90X2LJGY"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PZ90X2LJGY');
          `}
        </Script>
      </body>
    </html>
  );
}
