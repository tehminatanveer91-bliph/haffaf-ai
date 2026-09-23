import "./globals.css";

export const metadata = {
  title: "Haffaf AI",
  description: "AI Chatbot developed by Haffaf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
