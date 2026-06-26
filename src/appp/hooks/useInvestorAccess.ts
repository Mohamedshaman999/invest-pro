import { Role } from "../constants/roles";
import { useAuth } from "../contexts/AuthContext";

/** Accès Pro : `investorRole` et/ou `isPro` (profil login / GET profil) pour éviter un état désynchronisé. */
export function useIsProInvestor(): boolean {
  const { user } = useAuth();
  if (!user || user.role === "admin") return false;
  return user.investorRole === Role.PRO_INVESTOR || user.isPro === true;
}
