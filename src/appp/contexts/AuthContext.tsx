import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { TOKEN_KEY, REFRESH_KEY, clearAuthStorage, ApiError, isApiError } from "../lib/api";
import {
  investApi,
  type LoginSuccessPayload,
  type LoginTotpRequiredPayload,
  type LoginUserPayload,
  type UserProfileResponse,
} from "../services/investApi";

export type UserRole = "admin" | "investor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Rôle compte investisseur (API). Absent ou INVESTOR = accès standard. */
  investorRole?: "INVESTOR" | "PRO_INVESTOR";
  preferredLanguage?: "fr" | "en" | "es" | "de" | "ar";
  isVerified?: boolean;
  currency?: string;
  /** Numéro national tunisien (8 chiffres), sans indicatif +216. */
  phone?: string;
  notifyTransactionEmail?: boolean;
  notifyPriceAlertEmail?: boolean;
  twoFaEnabled?: boolean;
  twoFaMethod?: "email" | "totp";
  /** Abonnement Pro (source de vérité API). */
  isPro?: boolean;
  proStartedAt?: string | null;
  proExpiresAt?: string | null;
  proPlanType?: "monthly" | "yearly" | null;
}

export type LoginOutcome =
  | { kind: "authenticated" }
  | {
      kind: "totp_required";
      loginChallengeToken: string;
      userId: number;
      email: string;
      name: string;
    };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  completeTotpLogin: (input: { userId: number; loginChallengeToken: string; otpCode: string }) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  register: (input: { name: string; email: string; password: string; currency?: string }) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  /** Recharge le profil depuis l’API (ex. après paiement Pro). Passer `prefetched` pour éviter un GET dupliqué. */
  refreshUserProfile: (prefetchedProfile?: UserProfileResponse) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveRole(email: string): UserRole {
  const normalizedEmail = email.toLowerCase();
  return normalizedEmail.startsWith("admin@") ||
    normalizedEmail.endsWith("@admin.com") ||
    normalizedEmail.includes("+admin@")
    ? "admin"
    : "investor";
}

function normalizeInvestorRole(raw: unknown): "INVESTOR" | "PRO_INVESTOR" {
  return raw === "PRO_INVESTOR" ? "PRO_INVESTOR" : "INVESTOR";
}

function subscriptionFieldsFromLogin(u: LoginUserPayload): Pick<User, "isPro" | "proStartedAt" | "proExpiresAt" | "proPlanType"> {
  return {
    isPro: u.isPro === true,
    proStartedAt: u.proStartedAt ?? undefined,
    proExpiresAt: u.proExpiresAt ?? undefined,
    proPlanType: u.proPlanType === "yearly" || u.proPlanType === "monthly" ? u.proPlanType : undefined,
  };
}

function patchUserFromProfile(p: UserProfileResponse): Partial<User> {
  return {
    investorRole: normalizeInvestorRole(p.investorRole),
    isPro: p.isPro === true,
    proStartedAt: p.proStartedAt ?? undefined,
    proExpiresAt: p.proExpiresAt ?? undefined,
    proPlanType: p.proPlanType === "yearly" || p.proPlanType === "monthly" ? p.proPlanType : undefined,
    name: p.name,
    phone: p.phone?.trim() || undefined,
    currency: p.currency,
    isVerified: p.isVerified === true,
    notifyTransactionEmail: p.notifyTransactionEmail,
    notifyPriceAlertEmail: p.notifyPriceAlertEmail,
    twoFaEnabled: p.twoFaEnabled,
    twoFaMethod: p.twoFaMethod === "totp" || p.twoFaMethod === "email" ? p.twoFaMethod : undefined,
  };
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    if (parsed && typeof parsed.email === "string") {
      const email = parsed.email.trim().toLowerCase();
      return {
        ...parsed,
        email,
        role: deriveRole(email),
        investorRole: normalizeInvestorRole(parsed.investorRole),
        isVerified: parsed.isVerified === true,
        isPro: parsed.isPro === true,
        proStartedAt: parsed.proStartedAt,
        proExpiresAt: parsed.proExpiresAt,
        proPlanType:
          parsed.proPlanType === "yearly" || parsed.proPlanType === "monthly" ? parsed.proPlanType : undefined,
      };
    }
    return null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lecture synchrone au 1er rendu : les useEffect des enfants (ex. RootLayout) s'exécutent
  // avant celui du parent ; un chargement différé faisait croire à "déconnecté" après F5.
  const [user, setUser] = useState<User | null>(readStoredUser);

  const applyLoginSuccess = useCallback((data: LoginSuccessPayload) => {
    if (!data?.accessToken || !data?.refreshToken || !data?.user?.email) {
      throw new ApiError("Invalid response from server. Check that the API is running and up to date.", 502);
    }
    const normalizedEmail = data.user.email.toLowerCase();
    const role = deriveRole(normalizedEmail);
    let preferredLanguage: User["preferredLanguage"] | undefined;
    try {
      preferredLanguage =
        (localStorage.getItem(`user-language:${normalizedEmail}`) as User["preferredLanguage"] | null) ?? undefined;
    } catch {
      preferredLanguage = undefined;
    }
    const newUser: User = {
      id: String(data.user.id),
      name: data.user.name,
      email: normalizedEmail,
      role,
      investorRole: normalizeInvestorRole(data.user.investorRole),
      isVerified: data.user.isVerified === true,
      currency: data.user.currency,
      phone: data.user.phone?.trim() || undefined,
      notifyTransactionEmail:
        typeof data.user.notifyTransactionEmail === "boolean" ? data.user.notifyTransactionEmail : undefined,
      notifyPriceAlertEmail:
        typeof data.user.notifyPriceAlertEmail === "boolean" ? data.user.notifyPriceAlertEmail : undefined,
      twoFaEnabled: typeof data.user.twoFaEnabled === "boolean" ? data.user.twoFaEnabled : undefined,
      twoFaMethod: data.user.twoFaMethod === "totp" || data.user.twoFaMethod === "email" ? data.user.twoFaMethod : undefined,
      preferredLanguage,
      ...subscriptionFieldsFromLogin(data.user),
    };
    try {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      if (newUser.preferredLanguage) {
        localStorage.setItem("app-language", newUser.preferredLanguage);
      }
    } catch {
      throw new ApiError(
        "Unable to save your session. Allow site storage (disable private mode or blockers) and try again.",
        0,
        "STORAGE_BLOCKED",
      );
    }
  }, []);

  const login = async (email: string, password: string): Promise<LoginOutcome> => {
    try {
      const data = await investApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      if (data && typeof data === "object" && (data as LoginTotpRequiredPayload).status === "2FA_REQUIRED") {
        const totp = data as LoginTotpRequiredPayload;
        if (
          typeof totp.loginChallengeToken === "string" &&
          typeof totp.userId === "number" &&
          totp.user &&
          typeof totp.user.email === "string"
        ) {
          return {
            kind: "totp_required",
            loginChallengeToken: totp.loginChallengeToken,
            userId: totp.userId,
            email: totp.user.email,
            name: typeof totp.user.name === "string" ? totp.user.name : "",
          };
        }
      }
      applyLoginSuccess(data as LoginSuccessPayload);
      return { kind: "authenticated" };
    } catch (e) {
      if (isApiError(e)) throw e;
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Unexpected error during login. Check the browser console and that the API matches this frontend version.";
      throw new ApiError(msg, 502);
    }
  };

  const completeTotpLogin = useCallback(
    async (input: { userId: number; loginChallengeToken: string; otpCode: string }) => {
      const digits = input.otpCode.replace(/\D/g, "").slice(0, 6);
      const data = await investApi.totpVerifyLogin({
        userId: input.userId,
        loginChallengeToken: input.loginChallengeToken,
        otpCode: digits,
      });
      applyLoginSuccess(data);
    },
    [applyLoginSuccess]
  );

  const logout = useCallback(() => {
    setUser(null);
    clearAuthStorage();
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = { ...prev, ...partial };
      if (typeof partial.email === "string") {
        const normalized = partial.email.trim().toLowerCase();
        next.email = normalized;
        next.role = deriveRole(normalized);
      }
      if (Object.prototype.hasOwnProperty.call(partial, "investorRole")) {
        next.investorRole = normalizeInvestorRole(partial.investorRole);
      }
      if (Object.prototype.hasOwnProperty.call(partial, "isVerified")) {
        next.isVerified = partial.isVerified === true;
      }
      if (Object.prototype.hasOwnProperty.call(partial, "isPro")) {
        next.isPro = partial.isPro === true;
      }
      if (Object.prototype.hasOwnProperty.call(partial, "proStartedAt")) {
        next.proStartedAt = partial.proStartedAt;
      }
      if (Object.prototype.hasOwnProperty.call(partial, "proExpiresAt")) {
        next.proExpiresAt = partial.proExpiresAt;
      }
      if (Object.prototype.hasOwnProperty.call(partial, "proPlanType")) {
        next.proPlanType =
          partial.proPlanType === "yearly" || partial.proPlanType === "monthly" ? partial.proPlanType : undefined;
      }
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; currency?: string }) => {
      await investApi.register({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        currency: input.currency || "TND",
      });
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await investApi.verifyEmail({ email: email.trim().toLowerCase(), code: code.trim() });
  }, []);

  const refreshUserProfile = useCallback(async (prefetchedProfile?: UserProfileResponse) => {
    const p = prefetchedProfile ?? (await investApi.getUserProfile());
    setUser((prev) => {
      if (!prev || prev.id !== String(p.id)) return prev;
      const next: User = { ...prev, ...patchUserFromProfile(p) };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return;

    let cancelled = false;

    const applyProfile = (p: UserProfileResponse) => {
      if (cancelled) return;
      setUser((prev) => {
        if (!prev || prev.id !== String(p.id)) return prev;
        const next: User = { ...prev, ...patchUserFromProfile(p) };
        localStorage.setItem("user", JSON.stringify(next));
        return next;
      });
    };

    void investApi.getUserProfile().then(applyProfile).catch(() => {});

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void investApi.getUserProfile().then(applyProfile).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        completeTotpLogin,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        register,
        verifyEmail,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
