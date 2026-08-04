import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Ambika Beauty | Bill Manager",
  description: "Smart cosmetic wholesale bill analyzer & product management system",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface text-slate-200 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#17171f",
              color: "#e2e8f0",
              border: "1px solid #2a2a35",
              borderRadius: "12px",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#a855f7", secondary: "#17171f" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#17171f" } },
          }}
        />
      </body>
    </html>
  );
}
