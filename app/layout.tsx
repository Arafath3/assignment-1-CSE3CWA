import "./globals.css";
import NavBar from "@/components/NavBar/NavBar";
import ScrollPersist from "@/components/ScrollPersist/ScrollPersist";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import Footer from "@/components/Footer/Footer"; // <- add
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
          {/* make the shell a flex column so the footer sits at the bottom */}
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <NavBar />
            <ScrollPersist />
            <main className="flex-1">{children}</main>{" "}
            {/* <- grows to push footer down */}
            <Footer name="Arafath" studentId="22035298" />{" "}
            {/* <- set your real name */}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
