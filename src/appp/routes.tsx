import { createBrowserRouter } from "react-router";
import { PageTransitionLayout } from "./components/layouts/PageTransitionLayout";
import { RootLayout } from "./components/layouts/RootLayout";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ForgotPasswordPage } from "./components/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/pages/ResetPasswordPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { PortfolioPage } from "./components/pages/PortfolioPage";
import { MarketsPage } from "./components/pages/MarketsPage";
import { TransactionsPage } from "./components/pages/TransactionsPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { AdminActifsPage } from "./components/pages/AdminActifsPage";
import { HomePage } from "./components/pages/HomePage";
import { LoadAccountPage } from "./components/pages/LoadAccountPage";
import { WithdrawPage } from "./components/pages/WithdrawPage";
import { UpgradePage } from "./components/pages/UpgradePage";
import { UpgradeD17Page } from "./components/pages/UpgradeD17Page";
import { AssetAiPage } from "./components/pages/AssetAiPage";
import { InvestmentSimulatorPage } from "./components/pages/InvestmentSimulatorPage";
import { AiTradingPage } from "./components/pages/AiTradingPage";
import { AiAssistantPage } from "./components/pages/AiAssistantPage";
import { MessagesPage } from "./components/pages/MessagesPage";
import { AdminMessagesPage } from "./components/pages/AdminMessagesPage";
import { AdminUsersPage } from "./components/pages/AdminUsersPage";
import { StockSymbolPage } from "./components/pages/StockSymbolPage";
import { AdminDashboardPage } from "./components/pages/AdminDashboardPage";
import { RequireNonAdmin } from "./components/routing/RequireNonAdmin";
import { RequireAdmin } from "./components/routing/RequireAdmin";
import { RequireInvestorMessaging } from "./components/routing/RequireInvestorMessaging";
import { RequireProInvestor } from "./components/routing/RequireProInvestor";
import { Navigate } from "react-router";

export const router = createBrowserRouter([
  {
    Component: PageTransitionLayout,
    children: [
      {
        path: "/login",
        Component: LoginPage,
      },
      {
        path: "/register",
        Component: RegisterPage,
      },
      {
        path: "/forgot-password",
        Component: ForgotPasswordPage,
      },
      {
        path: "/reset-password",
        Component: ResetPasswordPage,
      },
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: HomePage },
          {
            path: "dashboard",
            element: (
              <RequireNonAdmin>
                <DashboardPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "portfolio",
            element: (
              <RequireNonAdmin>
                <PortfolioPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "markets",
            element: (
              <RequireNonAdmin>
                <MarketsPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "stock/:symbol",
            element: (
              <RequireNonAdmin>
                <StockSymbolPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "ai/asset",
            element: (
              <RequireNonAdmin>
                <RequireProInvestor>
                  <AssetAiPage />
                </RequireProInvestor>
              </RequireNonAdmin>
            ),
          },
          {
            path: "ai/simulator",
            element: (
              <RequireNonAdmin>
                <RequireProInvestor>
                  <InvestmentSimulatorPage />
                </RequireProInvestor>
              </RequireNonAdmin>
            ),
          },
          {
            path: "ai-trading",
            element: (
              <RequireNonAdmin>
                <RequireProInvestor>
                  <AiTradingPage />
                </RequireProInvestor>
              </RequireNonAdmin>
            ),
          },
          {
            path: "ai/assistant",
            element: (
              <RequireNonAdmin>
                <RequireProInvestor>
                  <AiAssistantPage />
                </RequireProInvestor>
              </RequireNonAdmin>
            ),
          },
          {
            path: "transactions",
            element: (
              <RequireNonAdmin>
                <TransactionsPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "messages",
            element: (
              <RequireInvestorMessaging>
                <MessagesPage />
              </RequireInvestorMessaging>
            ),
          },
          {
            path: "messages/:conversationId",
            element: (
              <RequireInvestorMessaging>
                <MessagesPage />
              </RequireInvestorMessaging>
            ),
          },
          { path: "settings", Component: SettingsPage },
          {
            path: "upgrade/d17",
            element: (
              <RequireNonAdmin>
                <UpgradeD17Page />
              </RequireNonAdmin>
            ),
          },
          {
            path: "upgrade",
            element: (
              <RequireNonAdmin>
                <UpgradePage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "load-account",
            element: (
              <RequireNonAdmin>
                <LoadAccountPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "withdraw",
            element: (
              <RequireNonAdmin>
                <WithdrawPage />
              </RequireNonAdmin>
            ),
          },
          {
            path: "pro",
            element: (
              <RequireNonAdmin>
                <Navigate to="/upgrade" replace />
              </RequireNonAdmin>
            ),
          },
          {
            path: "admin/dashboard",
            element: (
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            ),
          },
          { path: "admin/actifs", Component: AdminActifsPage },
          { path: "admin/users", Component: AdminUsersPage },
          { path: "admin/messages", Component: AdminMessagesPage },
          { path: "admin/messages/:conversationId", Component: AdminMessagesPage },
        ],
      },
    ],
  },
]);
