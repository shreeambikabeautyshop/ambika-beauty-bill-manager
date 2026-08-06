import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Ambika Beauty | Bill Manager",
  description: "Smart cosmetic wholesale bill analyzer for Shree Ambika Beauty Shop",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ambika Bills",
    startupImage: "/icon-512.png",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0f0f13" },
    { media: "(prefers-color-scheme: light)", color: "#0f0f13" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-surface text-slate-200 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#17171f",
              color: "#e2e8f0",
              border: "1px solid #2a2a35",
              borderRadius: "12px",
              fontSize: "13px",
              maxWidth: "90vw",
            },
            success: { iconTheme: { primary: "#a855f7", secondary: "#17171f" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#17171f" } },
          }}
        />
      </body>
    </html>
  );
}
