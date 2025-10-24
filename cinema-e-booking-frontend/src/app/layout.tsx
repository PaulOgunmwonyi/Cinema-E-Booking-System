import "./globals.css";
import Header from "./components/Header";
import { UserProvider } from "./contexts/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <UserProvider>
          <Header />
          <main className="min-h-screen relative">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
