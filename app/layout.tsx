import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import ScrollPersist from "@/components/ScrollPersist/ScrollPersist";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { Libertinus_Sans } from "next/font/google";

const libertinus = Libertinus_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={libertinus.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground">
            <NavBar />
            <ScrollPersist />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
