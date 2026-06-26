import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { WalletProvider } from "./contexts/WalletContext";
import { MarketDataProvider } from "./contexts/MarketDataContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MessagingProvider } from "./contexts/MessagingContext";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MarketDataProvider>
            <WalletProvider>
              <PortfolioProvider>
                <MessagingProvider>
                  <RouterProvider router={router} />
                  <Toaster richColors position="top-center" />
                </MessagingProvider>
              </PortfolioProvider>
            </WalletProvider>
          </MarketDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
