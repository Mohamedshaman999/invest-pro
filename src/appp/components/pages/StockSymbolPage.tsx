import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

/** Redirige vers Marchés en ouvrant la fiche correspondante au symbole. */
export function StockSymbolPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const s = (symbol ?? "").trim();
    if (!s) {
      navigate("/markets", { replace: true });
      return;
    }
    navigate(`/markets?symbol=${encodeURIComponent(s)}`, { replace: true });
  }, [symbol, navigate]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ip-muted">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400/80" aria-hidden />
      <span className="text-sm">Chargement...</span>
    </div>
  );
}
