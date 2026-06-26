import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Trash2, RefreshCw, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useMarketData } from "../../contexts/MarketDataContext";
import type { MarketStock } from "../../data/marketData";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTndWithUnit } from "../../utils/tndCurrency";

type StockType = MarketStock["type"];

export function AdminActifsPage() {
  const { isAdmin } = useAuth();
  const { text } = useLanguage();
  const { language } = useLanguage();
  const isFr = language === "fr";
  const navigate = useNavigate();
  const { markets, addMarket, removeMarket, refreshMarketPrice } = useMarketData();

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<StockType>("stock");
  const [apiUrl, setApiUrl] = useState("");
  const [price, setPrice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const sorted = useMemo(
    () => [...markets].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [markets]
  );

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const parsedPrice = price.trim() ? Number(price.replace(",", ".")) : undefined;
      await addMarket({
        symbol,
        name,
        type,
        apiUrl: apiUrl.trim() || undefined,
        price: parsedPrice != null && Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      });
      setSuccess(isFr ? "Actif ajoute." : "Asset added.");
      setSymbol("");
      setName("");
      setType("stock");
      setApiUrl("");
      setPrice("");
    } catch {
      setError("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (sym: string) => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await removeMarket(sym);
      setSuccess(isFr ? "Actif supprime." : "Asset removed.");
    } catch {
      setError("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onRefresh = async (sym: string) => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await refreshMarketPrice(sym);
      setSuccess(isFr ? `Prix mis a jour: ${sym}` : `Price updated: ${sym}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h1 className="text-3xl font-bold text-ip">{text.pages.admin.title}</h1>
          </div>
          <p className="mt-2 text-ip-muted">
            {text.pages.admin.subtitle}
          </p>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            error
              ? "border-red-400/25 bg-red-500/10 text-red-800 dark:text-red-200"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          }`}
        >
          {error || success}
        </div>
      )}

      {/* Formulaire ajout */}
      <div className="overflow-hidden rounded-xl ip-panel p-6">
        <h2 className="mb-4 text-lg font-bold text-ip">{isFr ? "Ajouter un nouvel actif" : "Add a new asset"}</h2>
        <form onSubmit={onAdd} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ip-secondary">{isFr ? "Symbole" : "Symbol"}</label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Ex: AAPL"
              className="app-field w-full rounded-lg px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ip-secondary">{isFr ? "Nom" : "Name"}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isFr ? "Nom de l'entreprise / actif" : "Asset / company name"}
              className="app-field w-full rounded-lg px-4 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ip-secondary">{isFr ? "Type" : "Type"}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StockType)}
              className="app-field-select w-full rounded-lg px-4 py-3"
            >
              <option value="stock">{isFr ? "Action" : "Stock"}</option>
              <option value="crypto">Crypto</option>
              <option value="etf">ETF</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ip-secondary">{isFr ? "Prix (optionnel)" : "Price (optional)"}</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 92.50"
              className="app-field w-full rounded-lg px-4 py-3"
              inputMode="decimal"
            />
            <p className="mt-1 text-xs text-ip-secondary">
              {isFr ? "Si vide, le prix sera recupere via l'API." : "If empty, price will be fetched from API."}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ip-secondary">{isFr ? "API de prix (optionnel)" : "Price API (optional)"}</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="Ex: https://api.example.com/price?symbol=AAPL"
              className="app-field w-full rounded-lg px-4 py-3"
            />
            <p className="mt-1 text-xs text-ip-secondary">
              {isFr ? "L'API doit retourner du JSON contenant `price` (ou `currentPrice` / `last` / `close`)." : "API should return JSON with `price` (or `currentPrice` / `last` / `close`)."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 md:col-span-2">
            <button type="submit" disabled={busy} className="hero-cta inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-60">
              <Plus className="h-5 w-5" />
              <span className="hero-cta-label">{isFr ? "Ajouter" : "Add"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Liste actifs */}
      <div className="overflow-hidden rounded-xl ip-panel">
        <div className="border-b border-ip p-6">
          <h2 className="text-lg font-bold text-ip">
            {isFr ? "Actifs disponibles" : "Available assets"} ({sorted.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip ip-table-head">
                <th className="px-6 py-3 text-left font-semibold text-ip-muted">Symbole</th>
                <th className="px-6 py-3 text-left font-semibold text-ip-muted">Nom</th>
                <th className="px-6 py-3 text-left font-semibold text-ip-muted">Type</th>
                <th className="px-6 py-3 text-right font-semibold text-ip-muted">Prix</th>
                <th className="px-6 py-3 text-left font-semibold text-ip-muted">API</th>
                <th className="px-6 py-3 text-right font-semibold text-ip-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.symbol} className="border-b border-ip/50 transition-colors ip-row-hover">
                  <td className="px-6 py-4 font-bold text-ip">{m.symbol}</td>
                  <td className="px-6 py-4 text-ip-secondary">{m.name}</td>
                  <td className="px-6 py-4 capitalize text-ip-secondary">{m.type === "stock" ? "Action" : m.type}</td>
                  <td className="ip-fintech-nums px-6 py-4 text-right font-semibold text-ip">
                    {formatTndWithUnit(m.price)}
                  </td>
                  <td className="px-6 py-4 text-ip-muted">
                    {m.apiUrl ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="max-w-[420px] truncate">{m.apiUrl}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busy || !m.apiUrl}
                        onClick={() => onRefresh(m.symbol)}
                        className="inline-flex items-center gap-2 rounded-lg border border-ip px-3 py-2 text-ip-secondary transition-colors hover:bg-[var(--ip-nav-hover-bg)] disabled:opacity-50"
                        title={m.apiUrl ? "Rafraîchir le prix via l'API" : "Aucune API"}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Mettre à jour
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDelete(m.symbol)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300"
                        title="Supprimer l'actif"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

