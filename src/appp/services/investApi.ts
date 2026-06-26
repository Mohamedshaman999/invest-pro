import { apiFetch } from "../lib/api";

function normalizeHistoryPayload(data: unknown): Array<{ date: string; price: number }> {
  if (!Array.isArray(data)) return [];
  const out: Array<{ date: string; price: number }> = [];
  for (const item of data) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const price = Number(o.price);
    if (!Number.isFinite(price)) continue;
    out.push({ date: String(o.date ?? ""), price });
  }
  return out;
}

export type AssetDetailAnalysis = {
  status: string;
  insufficientData: boolean;
  sma20: number | null;
  rsi14: number | null;
  closesUsed: number;
  lastClose: number | null;
};

export type AssetDetailResponse = {
  id: number;
  ticker: string;
  name: string;
  currentPrice: number;
  category: string;
  updatedAt?: string;
  variationPercent?: number | null;
  volume?: number | null;
  capMarket?: number | null;
  history: Array<{ date: string; price: number }>;
  analysis: AssetDetailAnalysis;
};

export type ApiAsset = {
  id: number;
  ticker: string;
  name: string;
  currentPrice: number;
  category: string;
  updatedAt?: string;
  /** Variation % (BVMT / historique), colonne `variation_percent` */
  variationPercent?: number | null;
  /** Session volume (shares) from BVMT sync */
  volume?: number | null;
  /** Capitalisation échangée (TND) */
  capMarket?: number | null;
};

/** Réponse GET /stocks/search */
export type StockSearchResult = {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change_24h: number | null;
  logo: string | null;
};

export type ProPlanType = "monthly" | "yearly";

export type LoginUserPayload = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  isVerified: boolean;
  investorRole?: "INVESTOR" | "PRO_INVESTOR";
  /** Aligné backend `is_pro` (abonnement actif). */
  isPro?: boolean;
  proStartedAt?: string | null;
  proExpiresAt?: string | null;
  proPlanType?: ProPlanType | null;
  notifyTransactionEmail?: boolean;
  notifyPriceAlertEmail?: boolean;
  twoFaEnabled?: boolean;
  twoFaMethod?: "email" | "totp";
};

export type LoginSuccessPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: LoginUserPayload;
};

export type LoginTotpRequiredPayload = {
  status: "2FA_REQUIRED";
  twoFaMethod: "totp";
  loginChallengeToken: string;
  userId: number;
  user: { id: number; name: string; email: string };
};

export type LoginApiResult = LoginSuccessPayload | LoginTotpRequiredPayload;

/** @deprecated Utiliser LoginSuccessPayload ou LoginApiResult */
export type LoginResponse = LoginSuccessPayload;

export type UserProfileResponse = {
  id: number;
  name: string;
  email: string;
  phone: string;
  currency: string;
  isVerified: boolean;
  investorRole?: "INVESTOR" | "PRO_INVESTOR";
  isPro?: boolean;
  proStartedAt?: string | null;
  proExpiresAt?: string | null;
  proPlanType?: ProPlanType | null;
  notifyTransactionEmail: boolean;
  notifyPriceAlertEmail: boolean;
  twoFaEnabled: boolean;
  twoFaMethod: "email" | "totp";
};

export type AdminUserDto = {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  displayName: string;
  email: string;
  investorRole: "INVESTOR" | "PRO_INVESTOR";
  lastActiveAt: string | null;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockReason: string | null;
  lockUntil: string | null;
  isVerified: boolean;
  createdAt: string | null;
};

export type AdminUsersListResponse = {
  users: AdminUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type NotificationPreferences = {
  notifyTransactionEmail: boolean;
  notifyPriceAlertEmail: boolean;
};

export type WalletResponse = {
  balance: number;
  currency: string;
};

export type PortfolioLine = {
  assetId: number;
  ticker: string;
  name: string;
  category: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  lineValue: number;
  lineInvested: number;
  linePnL: number;
};

export type PortfolioResponse = {
  currency: string;
  summary: {
    totalValue: number;
    investedAmount: number;
    profitLoss: number;
  };
  assets: PortfolioLine[];
};

export type AssetAiInfoResponse = {
  description: string;
  riskLevel: string;
  whyInvest: string[];
};

export type InvestmentSimulateCurvePoint = {
  year: number;
  months: number;
  value: number;
  contributions: number;
};

export type PortfolioExpectedReturnRow = {
  symbol: string;
  weight: number;
  return: number;
};

export type PortfolioExpectedReturnResponse = {
  expectedReturn: number;
  breakdown: PortfolioExpectedReturnRow[];
};

export type InvestmentSimulateResponse = {
  inputs: {
    monthlyInvestment: number;
    years: number;
    annualReturnPercent: number;
    months: number;
    monthlyRate: number;
    assumption: string;
    returnSource?: "portfolio" | "custom";
    lookbackYears?: number | null;
  };
  expectedReturn: number;
  breakdown: PortfolioExpectedReturnRow[];
  returnSource: "portfolio" | "custom";
  finalValue: number;
  totalContributions: number;
  gain: number;
  gainPercent: number;
  curve: InvestmentSimulateCurvePoint[];
  explanation: string;
  explanationSource?: string;
};

export type ApiTransactionRow = {
  id: string;
  assetSymbol: string;
  assetName: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  total: number;
};

export type AiTradingBotRule = {
  id: string;
  assetSymbol: string;
  buyConditionType: "percentage" | "price" | "ai_signal";
  buyThreshold: number;
  sellConditionType: "percentage" | "price" | "ai_signal";
  sellThreshold: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  useAiBuySignal: boolean;
  useAiExit: boolean;
};

export type AiTradingBotRow = {
  id: string;
  name: string;
  status: "active" | "paused" | "stopped";
  mode: "manual_strategy" | "ai_strategy";
  maxTransactionsPerDay: number;
  maxAllocation: number;
  riskLevel: "low" | "medium" | "high";
  dailyRealizedLossTnd: number;
  createdAt: string;
  rules: AiTradingBotRule[];
};

export type MessagingConversationRole = "investor" | "pro_investor";
export type MessagingConversationStatus = "open" | "closed";

export type MessagingConversationSummary = {
  id: string;
  userId: number;
  role: MessagingConversationRole;
  status: MessagingConversationStatus;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: { content: string; sender: "user" | "admin"; createdAt: string } | null;
  unreadCount: number;
};

export type MessagingMessage = {
  id: string;
  conversationId: string;
  sender: "user" | "admin";
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type MessagingConversationDetail = Omit<MessagingConversationSummary, "lastMessage" | "unreadCount">;

export type AiAssistantChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type AiAssistantConversationSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: { content: string; role: string; createdAt: string } | null;
};

export type AiTradingFeedRow = {
  id: string;
  assetSymbol: string;
  action: "buy" | "sell";
  amount: number;
  price: number;
  quantity: number;
  status: "success" | "failed" | "pending";
  timestamp: string;
  errorMessage: string | null;
};

export const investApi = {
  register(body: { name: string; email: string; password: string; currency?: string }) {
    return apiFetch<{ id: number; email: string; message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  verifyEmail(body: { email: string; code: string }) {
    return apiFetch<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  login(body: { email: string; password: string }) {
    return apiFetch<LoginApiResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  totpVerifyLogin(body: { loginChallengeToken: string; userId: number; otpCode: string }) {
    return apiFetch<LoginSuccessPayload>("/auth/2fa/totp/verify-login", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  totpSetup(body: { currentPassword: string }) {
    return apiFetch<{ qrCodeImage: string; manualSecret: string; setupToken: string }>("/auth/2fa/totp/setup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  totpVerifySetup(body: { setupToken: string; otpCode: string; currentPassword: string }) {
    return apiFetch<{ message: string; twoFaEnabled: boolean; twoFaMethod: string }>("/auth/2fa/totp/verify-setup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  totpDisable(body: { currentPassword: string }) {
    return apiFetch<{ message: string; twoFaEnabled: boolean; twoFaMethod: string }>("/auth/2fa/totp/disable", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getUserProfile() {
    return apiFetch<UserProfileResponse>("/user/profile");
  },

  /** Confirmation paiement Pro (backend met à jour abonnement et renvoie le profil à jour). */
  completeProSubscription(body: { planType: ProPlanType }) {
    return apiFetch<{ message: string; profile: UserProfileResponse }>("/subscriptions/pro/complete", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  requestPasswordReset(body: { email: string }) {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  resetPassword(body: { email: string; code: string; newPassword: string }) {
    return apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }, { skipAuth: true });
  },

  requestPasswordChange(body: { currentPassword: string }) {
    return apiFetch<{ message: string; requestId: string }>("/auth/request-password-change", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  confirmPasswordChange(body: {
    requestId: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return apiFetch<{ message: string }>("/auth/confirm-password-change", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /** GET /stocks/search?q= — résultats compacts pour l’autocomplétion header. */
  searchStocks(q: string, signal?: AbortSignal) {
    const params = new URLSearchParams();
    params.set("q", q.trim().slice(0, 128));
    return apiFetch<StockSearchResult[]>(`/stocks/search?${params.toString()}`, { signal }, { skipAuth: true });
  },

  getAssets() {
    return apiFetch<{ assets: ApiAsset[] }>("/assets", {}, { skipAuth: true });
  },

  getHistory(ticker: string) {
    return apiFetch<unknown>(`/assets/${encodeURIComponent(ticker)}/history`, {}, { skipAuth: true }).then(
      normalizeHistoryPayload
    );
  },

  getAssetDetail(ticker: string) {
    return apiFetch<AssetDetailResponse>(
      `/assets/${encodeURIComponent(ticker)}/detail`,
      {},
      { skipAuth: true }
    );
  },

  postAssetAiInfo(body: { ticker: string; lang?: "fr" | "en" }) {
    return apiFetch<AssetAiInfoResponse>("/ai/asset-info", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getPortfolioExpectedReturn(years: number) {
    const y = Number.isFinite(years) ? years : 5;
    return apiFetch<PortfolioExpectedReturnResponse>(
      `/portfolio/expected-return?years=${encodeURIComponent(String(y))}`,
      {}
    );
  },

  postInvestmentSimulate(body: {
    monthlyInvestment: number;
    years: number;
    lang?: "fr" | "en";
    useCustomReturn?: boolean;
    customAnnualReturnPercent?: number;
  }) {
    return apiFetch<InvestmentSimulateResponse>("/ai/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getWallet() {
    return apiFetch<WalletResponse>("/wallet");
  },

  getBalance() {
    return apiFetch<{ balance: number }>("/balance");
  },

  deposit(body: { amount: number }) {
    return apiFetch<{ balance: number; message: string }>("/deposit", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  withdraw(body: { amount: number }) {
    return apiFetch<{ balance: number; message: string }>("/withdraw", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getPortfolio() {
    return apiFetch<PortfolioResponse>("/portfolio");
  },

  getPerformance() {
    return apiFetch<Array<{ date: string; value: number }>>("/portfolio/performance");
  },

  getTransactions() {
    return apiFetch<{ transactions: ApiTransactionRow[] }>("/transactions");
  },

  buy(body: { assetId: number; quantity: number }) {
    return apiFetch("/transactions/buy", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  sell(body: { assetId: number; quantity: number }) {
    return apiFetch("/transactions/sell", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminCreateAsset(body: { ticker: string; name: string; category?: string; currentPrice: number }) {
    return apiFetch("/admin/assets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminDeleteAsset(ticker: string) {
    return apiFetch(`/admin/assets/${encodeURIComponent(ticker)}`, { method: "DELETE" });
  },

  adminListUsers(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.limit != null) q.set("limit", String(params.limit));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<AdminUsersListResponse>(`/admin/users${suffix}`);
  },

  adminGetUser(userId: number) {
    return apiFetch<AdminUserDto>(`/admin/users/${encodeURIComponent(String(userId))}`);
  },

  adminDeleteUser(userId: number) {
    return apiFetch<{ message: string; id: number }>(`/admin/users/${encodeURIComponent(String(userId))}`, {
      method: "DELETE",
    });
  },

  adminUnlockUser(userId: number) {
    return apiFetch<AdminUserDto>(`/admin/users/${encodeURIComponent(String(userId))}/unlock`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  },

  getNotificationPreferences() {
    return apiFetch<NotificationPreferences>("/user/notification-preferences");
  },

  patchNotificationPreferences(body: Partial<NotificationPreferences>) {
    return apiFetch<NotificationPreferences>("/user/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  patchUserProfile(body: { name?: string; email?: string; phone?: string }) {
    return apiFetch<UserProfileResponse>("/user/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  getAiTradingBots() {
    return apiFetch<{ bots: AiTradingBotRow[] }>("/ai-trading/bots");
  },

  createAiTradingBot(body: {
    name: string;
    mode: "manual_strategy" | "ai_strategy";
    maxTransactionsPerDay: number;
    maxAllocation: number;
    riskLevel: "low" | "medium" | "high";
    rules: Omit<AiTradingBotRule, "id">[];
  }) {
    return apiFetch<{ bot: unknown }>("/ai-trading/bots", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patchAiTradingBotStatus(botId: string, status: "active" | "paused" | "stopped") {
    return apiFetch<{ id: string; status: string }>(`/ai-trading/bots/${encodeURIComponent(botId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  getAiTradingBotTransactions(botId: string) {
    return apiFetch<{ transactions: AiTradingFeedRow[] }>(
      `/ai-trading/bots/${encodeURIComponent(botId)}/transactions`
    );
  },

  createMessagingConversation(body: { subject?: string; message: string }) {
    return apiFetch<{ conversation: MessagingConversationDetail; message: MessagingMessage }>("/conversations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listMessagingConversations() {
    return apiFetch<{ conversations: MessagingConversationSummary[] }>("/conversations");
  },

  getMessagingConversation(conversationId: string) {
    return apiFetch<{ conversation: MessagingConversationDetail; messages: MessagingMessage[] }>(
      `/conversations/${encodeURIComponent(conversationId)}`
    );
  },

  sendMessagingMessage(body: { conversationId: string; content: string }) {
    return apiFetch<{ message: MessagingMessage }>("/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminListMessagingConversations(params?: { status?: string; role?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.role) q.set("role", params.role);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<{
      conversations: Array<
        MessagingConversationSummary & {
          user: { id: number; name: string; email: string } | null;
        }
      >;
    }>(`/admin/conversations${suffix}`);
  },

  adminGetMessagingConversation(conversationId: string) {
    return apiFetch<{
      conversation: MessagingConversationDetail & {
        user: { id: number; name: string; email: string } | null;
      };
      messages: MessagingMessage[];
    }>(`/admin/conversations/${encodeURIComponent(conversationId)}`);
  },

  adminSendMessagingMessage(body: { conversationId: string; content: string }) {
    return apiFetch<{ message: MessagingMessage }>("/admin/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  adminPatchMessagingConversation(conversationId: string, body: { status: "open" | "closed" }) {
    return apiFetch<{ conversation: MessagingConversationDetail }>(
      `/admin/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );
  },

  postAiChat(body: {
    message: string;
    conversationId?: string;
    stock_context?: { ticker: string };
    lang?: "fr" | "en";
  }) {
    return apiFetch<{ reply: string; conversationId: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listAiConversations() {
    return apiFetch<{ conversations: AiAssistantConversationSummary[] }>("/ai/conversations");
  },

  getAiConversation(conversationId: string) {
    return apiFetch<{
      conversation: { id: string; createdAt: string; updatedAt: string };
      messages: AiAssistantChatMessage[];
    }>(`/ai/conversations/${encodeURIComponent(conversationId)}`);
  },

  deleteAiConversation(conversationId: string) {
    return apiFetch<null>(`/ai/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
    });
  },
};
