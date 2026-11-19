import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "400", "700", "900"],
});

export const metadata = {
  title: "AI Course Generator",
  description: "Generate personalized learning paths with AI",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
          <GoogleOneTap />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}