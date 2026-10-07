import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import Script from "next/script";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/site";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Let Me Hear You — Komunitas & Ruang Cerita Kesehatan Mental",
    template: "%s | Let Me Hear You",
  },
  description:
    "Platform dan komunitas kesehatan mental Indonesia. Ruang aman untuk menulis cerita, refleksi jiwa, berbagi karya, dan saling mendengarkan tanpa penghakiman.",
  keywords: [
    "Let Me Hear You",
    "kesehatan mental",
    "komunitas kesehatan mental",
    "ruang cerita",
    "curhat online aman",
    "mental health indonesia",
    "self care",
    "refleksi diri",
    "penulis kesehatan mental",
    "ruang refleksi",
  ],
  authors: [{ name: "Let Me Hear You" }],
  creator: "Let Me Hear You",
  publisher: "Let Me Hear You",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Let Me Hear You",
    title: "Let Me Hear You — Komunitas & Ruang Cerita Kesehatan Mental",
    description:
      "Platform dan komunitas kesehatan mental Indonesia. Ruang aman untuk menulis cerita, refleksi jiwa, berbagi karya, dan saling mendengarkan tanpa penghakiman.",
    images: [
      {
        url: "/assets/logo let me hear you.jpeg",
        width: 512,
        height: 512,
        alt: "Logo Let Me Hear You",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Let Me Hear You — Komunitas & Ruang Cerita Kesehatan Mental",
    description:
      "Platform dan komunitas kesehatan mental Indonesia. Ruang aman untuk menulis cerita, refleksi jiwa, berbagi karya, dan saling mendengarkan.",
    images: ["/assets/logo let me hear you.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/logo let me hear you.jpeg",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Let Me Hear You",
      url: siteUrl,
      logo: `${siteUrl}/assets/logo%20let%20me%20hear%20you.jpeg`,
      description:
        "Platform dan komunitas kesehatan mental Indonesia. Ruang aman untuk berbagi cerita, merawat karya, dan saling mendengarkan.",
      sameAs: ["https://web.facebook.com/LetMeHearYouOfficial"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Let Me Hear You",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "id-ID",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${poppins.variable} min-h-screen antialiased`}>
        {children}
        <InstallAppBanner />
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
