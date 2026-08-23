import "./globals.css";
import React from "react";

export const metadata = {
  title: "Altibbe Work Intake & Execution Engine",
  description: "Agentic Work Intake & Execution Prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
