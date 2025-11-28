import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "../components/ModalContext";
import FooterWrapper from "../components/FooterWrapper";
import PageContentWrapper from "../components/PageContentWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = { 
  title: "Portal APAE",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, var(--font-geist-sans), sans-serif",
          height: "100%",
        }}
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <ModalProvider>
          <PageContentWrapper>{children}</PageContentWrapper>
          <FooterWrapper />
        </ModalProvider>
      </body>
    </html>
  );
}
