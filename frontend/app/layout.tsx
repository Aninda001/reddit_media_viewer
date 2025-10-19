import type { Metadata } from "next";
import { PrimeReactProvider } from "primereact/api";
import { Inter } from "next/font/google";
import "./globals.css";
import "primeicons/primeicons.css";
import { Provider } from "jotai";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reddit Media Viewer",
  description: "View reddit images and videos in a gallery format",
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
          id="theme-link"
          rel="stylesheet"
          href="/viva-dark/theme.css"
        />
      </head>
      <body className={inter.className}>
        <PrimeReactProvider>
          <Provider>{children}</Provider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
