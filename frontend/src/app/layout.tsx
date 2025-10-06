import "./globals.css";

import type { Metadata } from "next";
import React from "react";
import Navigation from "../components/Navigation";

export const metadata: Metadata = {
  title: "Stellar Counter DApp",
  description: "Counter DApp built on Stellar with Soroban smart contracts",
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                {children}
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
};

export default Layout;
