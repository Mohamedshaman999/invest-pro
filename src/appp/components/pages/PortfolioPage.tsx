import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { usePortfolio } from "../../contexts/PortfolioContext";
import { useWallet, roundStnd } from "../../contexts/WalletContext";
import { useMarketData } from "../../contexts/MarketDataContext";
import { StockMarketGlassSelect } from "../StockMarketGlassSelect";
import { filterMarketsByCategory, sortMarketsDisplayList } from "../../utils/marketListDisplay";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  X,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTndWithUnit } from "../../utils/tndCurrency";

export function PortfolioPage() {
  const { assets, addAsset, sellAsset, loading, error } = usePortfolio();
  const { markets, marketsCategoryFilter, marketsSortBy } = useMarketData();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stndBalance, refreshWallet, formatStnd } = useWallet();
  const { text, language } = useLanguage();
  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ar: "ar-SA" };
  const locale = localeMap[language] ?? "en-US";
  const isFr = language === "fr";
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedMarketStock, setSelectedMarketStock] =
    useState<string>("");
  const [sellQuantity, setSellQuantity] = useState("");
  const [selectedSellPercentage, setSelectedSellPercentage] = useState<number | null>(null);
  const [tradeBusy, setTradeBusy] = useState(false);

  const openSellModal = (asset: any) => {
    setSelectedAsset(asset);
    setSellQuantity("");
    setSelectedSellPercentage(null);
    setShowSellModal(true);
  };
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    purchasePrice: "",
    type: "stock" as "stock" | "crypto" | "etf",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // Gérer la sélection d'une action depuis la liste
  const handleStockSelection = (symbol: string) => {
    setSelectedMarketStock(symbol);
    const stock = markets.find((m) => m.symbol === symbol);
    if (stock) {
      setFormData((prev) => ({
        ...prev,
        symbol: stock.symbol,
        name: stock.name,
        purchasePrice: stock.price.toString(),
        type: stock.type,
      }));
    }
  };

  const sortedMarketOptions = useMemo(() => {
    const filtered = filterMarketsByCategory(markets, marketsCategoryFilter);
    return sortMarketsDisplayList(filtered, marketsSortBy);
  }, [markets, marketsCategoryFilter, marketsSortBy]);

  const marketOptionsForDropdown = useMemo(() => {
    if (!selectedMarketStock) return sortedMarketOptions;
    const inList = sortedMarketOptions.some((m) => m.symbol === selectedMarketStock);
    if (inList) return sortedMarketOptions;
    const orphan = markets.find((m) => m.symbol === selectedMarketStock);
    return orphan ? [orphan, ...sortedMarketOptions] : sortedMarketOptions;
  }, [sortedMarketOptions, selectedMarketStock, markets]);

  useEffect(() => {
    const st = location.state as { buySymbol?: string } | undefined;
    const sym = st?.buySymbol?.trim().toUpperCase();
    if (!sym) return;
    if (markets.length === 0) return;
    const found = markets.find((m) => m.symbol === sym);
    navigate(".", { replace: true, state: {} });
    if (!found) return;
    setShowAddModal(true);
    setSelectedMarketStock(sym);
    setFormData((prev) => ({
      ...prev,
      symbol: found.symbol,
      name: found.name,
      purchasePrice: found.price.toString(),
      type: found.type,
    }));
  }, [location.state, markets, navigate]);

  const purchaseTotal = useMemo(() => {
    const q = parseFloat(formData.quantity);
    const p = parseFloat(formData.purchasePrice);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p <= 0) return 0;
    return roundStnd(q * p);
  }, [formData.quantity, formData.purchasePrice]);

  const canAffordPurchase =
    Boolean(user?.isVerified) &&
    Boolean(selectedMarketStock) &&
    purchaseTotal > 0 &&
    roundStnd(stndBalance) + 1e-9 >= purchaseTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = markets.find((x) => x.symbol === selectedMarketStock);
    if (!m?.id) {
      toast.error("Something went wrong");
      return;
    }
    const cost = purchaseTotal;
    if (cost <= 0 || roundStnd(stndBalance) + 1e-9 < cost) return;
    setTradeBusy(true);
    try {
      await addAsset({
        assetId: m.id,
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        type: formData.type,
        purchaseDate: formData.purchaseDate,
      });
      await refreshWallet();
      toast.success("Trade successful");
      setShowAddModal(false);
      setSelectedMarketStock("");
      setFormData({
        symbol: "",
        name: "",
        quantity: "",
        purchasePrice: "",
        type: "stock",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
    } catch {
      void refreshWallet();
      toast.error("Something went wrong");
    } finally {
      setTradeBusy(false);
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAsset && sellQuantity) {
      const quantity = parseFloat(sellQuantity);
      if (quantity > selectedAsset.quantity) {
        alert(
          "La quantité à vendre ne peut pas dépasser la quantité disponible",
        );
        return;
      }
      if (quantity <= 0) {
        alert("La quantité doit être supérieure à 0");
        return;
      }
      setTradeBusy(true);
      try {
        await sellAsset(selectedAsset.id, quantity, selectedAsset.currentPrice);
        await refreshWallet();
        toast.success("Trade successful");
        setShowSellModal(false);
        setSellQuantity("");
        setSelectedSellPercentage(null);
        setSelectedAsset(null);
      } catch {
        void refreshWallet();
        toast.error("Something went wrong");
      } finally {
        setTradeBusy(false);
      }
    }
  };

  return (
    <div className="ip-fintech-nums space-y-6">
      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] px-4 py-3 text-sm text-ip-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFr ? "Chargement du portefeuille..." : "Loading portfolio..."}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Something went wrong
        </div>
      ) : null}
      {!user?.isVerified && user ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {isFr
            ? "Verifiez votre e-mail pour acheter ou vendre des actifs."
            : "Verify your email to buy or sell assets."}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-ip">{text.pages.portfolio.title}</h1>
          <p className="text-ip-muted">{text.pages.portfolio.subtitle}</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <p className="text-sm text-ip-muted">
            <span className="font-semibold text-ip">{text.header.stndChipLabel}:</span>{" "}
            <span className="ip-fintech-nums">{formatStnd(stndBalance, locale)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="hero-cta inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              <Plus className="h-5 w-5 shrink-0" />
              <span className="hero-cta-label">{text.pages.portfolio.buyAsset}</span>
            </button>
            <Link
              to="/load-account"
              className="hero-cta inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              <DollarSign className="h-5 w-5 shrink-0" />
              <span className="hero-cta-label">{text.pages.portfolio.loadAccount}</span>
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-ip transition-colors hover:bg-white/10"
            >
              {text.pages.portfolio.withdraw}
            </Link>
          </div>
        </div>
      </div>

      {/* Liste des actifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => {
          const profit =
            asset.quantity *
            (asset.currentPrice - asset.purchasePrice);
          const profitPercent =
            ((asset.currentPrice - asset.purchasePrice) /
              asset.purchasePrice) *
            100;
          const totalValue =
            asset.quantity * asset.currentPrice;

          return (
            <div
              key={asset.id}
              className="stock-card"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-xl font-bold text-ip">{asset.symbol}</h3>
                    <span className="rounded-lg bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-purple-200">
                      {asset.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-ip-muted">{asset.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-ip py-2">
                  <span className="text-sm text-ip-muted">{isFr ? "Quantite" : "Quantity"}</span>
                  <span className="font-semibold text-ip">{asset.quantity}</span>
                </div>

                <div className="flex items-center justify-between border-b border-ip py-2">
                  <span className="text-sm text-ip-muted">{isFr ? "Prix d'achat" : "Purchase price"}</span>
                  <span className="ip-fintech-nums font-semibold text-ip">{formatTndWithUnit(asset.purchasePrice)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-ip py-2">
                  <span className="text-sm text-ip-muted">{isFr ? "Prix actuel" : "Current price"}</span>
                  <span className="ip-fintech-nums font-semibold text-ip">{formatTndWithUnit(asset.currentPrice)}</span>
                </div>

                <div className="flex items-center justify-between border-b border-ip py-2">
                  <span className="text-sm text-ip-muted">{isFr ? "Valeur totale" : "Total value"}</span>
                  <span className="ip-fintech-nums font-bold text-ip">{formatTndWithUnit(totalValue)}</span>
                </div>

                <div className="pt-2">
                  <div
                    className={`flex items-center justify-between rounded-xl border p-3 ${profit >= 0 ? "border-emerald-500/25 bg-emerald-500/10" : "border-rose-500/25 bg-rose-500/10"}`}
                  >
                    <span className="text-sm font-medium text-ip-secondary dark:text-slate-300">
                      {isFr ? "Gain/Perte" : "Profit/Loss"}
                    </span>
                    <div
                      className={`flex items-center gap-1 font-bold ${profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {profit >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="ip-fintech-nums">
                        {profit >= 0 ? "+" : ""}
                        {formatTndWithUnit(profit)}
                      </span>
                      <span className="text-sm">
                        ({profitPercent >= 0 ? "+" : ""}
                        {profitPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-ip-subtle">
                  {isFr ? "Achete le " : "Bought on "}
                  {asset.purchaseDate && asset.purchaseDate !== "—"
                    ? new Date(`${asset.purchaseDate}T12:00:00`).toLocaleDateString(locale)
                    : "—"}
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => openSellModal(asset)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-4 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/30 transition-opacity hover:opacity-95"
                >
                  <DollarSign className="h-5 w-5 shrink-0" />
                  {text.pages.portfolio.sell}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal d'ajout d'actif */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ip-modal-overlay">
          <div className="ip-popover w-full max-w-md rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-ip">{isFr ? "Ajouter un actif" : "Add an asset"}</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-ip-subtle transition-colors hover:text-ip"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium uppercase tracking-wide text-ip-muted">
                  {isFr ? "Selectionner une action" : "Select a stock"}
                </label>
                <StockMarketGlassSelect
                  items={marketOptionsForDropdown}
                  value={selectedMarketStock}
                  onChange={handleStockSelection}
                  placeholder={isFr ? "-- Choisir une action --" : "-- Choose a stock --"}
                  listEmptyLabel={
                    isFr
                      ? "Aucun actif pour le filtre Marchés actuel. Changez le filtre sur la page Marchés."
                      : "No assets match the current Markets filter. Adjust filters on the Markets page."
                  }
                  disabled={tradeBusy}
                />
                <p className="mt-1 text-xs text-ip-subtle">
                  {isFr
                    ? "Liste alignée sur le filtre et le tri de la page Marchés."
                    : "List order follows your Markets page category filter and sort."}
                </p>
              </div>

              {selectedMarketStock && (
                <>
                  <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-ip-muted">Symbole:</span>
                        <span className="font-semibold text-ip">{formData.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ip-muted">Nom:</span>
                        <span className="font-semibold text-ip">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ip-muted">{isFr ? "Prix actuel:" : "Current price:"}</span>
                        <span className="ip-fintech-nums font-semibold text-violet-800 dark:text-purple-200">
                          {formatTndWithUnit(parseFloat(formData.purchasePrice) || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Quantite" : "Quantity"}</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: e.target.value,
                          })
                        }
                        className="app-field border-slate-200 bg-white text-slate-900 placeholder:text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-500"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-ip-muted">
                        {isFr ? "Prix d'achat (TND)" : "Purchase price (TND)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchasePrice: e.target.value,
                          })
                        }
                        className="app-field border-slate-200 bg-white text-slate-900 placeholder:text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Date d'achat" : "Purchase date"}</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseDate: e.target.value,
                        })
                      }
                      className="app-field border-slate-200 bg-white text-slate-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white"
                      required
                    />
                  </div>

                  {formData.quantity &&
                    formData.purchasePrice &&
                    purchaseTotal > 0 && (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-ip-secondary dark:text-slate-300">
                              {isFr ? "Total de l'achat:" : "Purchase total:"}
                            </span>
                            <span className="ip-fintech-nums font-bold text-emerald-700 dark:text-emerald-300">
                              {formatTndWithUnit(purchaseTotal)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-ip-muted">{text.pages.wallet.stndExplainer}</p>
                        </div>
                        {!canAffordPurchase ? (
                          <p className="text-sm font-medium text-rose-600 dark:text-red-400">
                            {text.pages.portfolio.insufficientStnd}
                          </p>
                        ) : null}
                      </div>
                    )}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-ip bg-slate-100/90 px-4 py-2.5 font-medium text-ip transition-colors hover:bg-slate-200/90 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={tradeBusy || !selectedMarketStock || !canAffordPurchase}
                  className="hero-cta flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                    {tradeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isFr ? "Ajouter" : "Add"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de vente d'actif */}
      {showSellModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ip-modal-overlay">
          <div className="ip-popover w-full max-w-md rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-ip">{isFr ? "Vendre un actif" : "Sell an asset"}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowSellModal(false);
                  setSelectedSellPercentage(null);
                }}
                className="text-ip-subtle transition-colors hover:text-ip"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleSellSubmit}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Symbole" : "Symbol"}</label>
                <input
                  type="text"
                  value={selectedAsset.symbol}
                  className="app-field border-slate-200 bg-white text-slate-900 opacity-90 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Nom complet" : "Full name"}</label>
                <input
                  type="text"
                  value={selectedAsset.name}
                  className="app-field border-slate-200 bg-white text-slate-900 opacity-90 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Quantite disponible" : "Available quantity"}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedAsset.quantity}
                  className="app-field border-slate-200 bg-white text-slate-900 opacity-90 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ip-muted">{isFr ? "Quantite a vendre" : "Quantity to sell"}</label>
                <div className="flex flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-ip focus-within:border-purple-400/40 focus-within:ring-2 focus-within:ring-purple-500/30 dark:border-white/10 sm:flex-row">
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max={selectedAsset.quantity}
                    value={sellQuantity}
                    onChange={(e) => {
                      setSellQuantity(e.target.value);
                      setSelectedSellPercentage(null);
                    }}
                    className="min-w-0 flex-1 border-0 bg-slate-100 px-4 py-2 text-slate-900 outline-none placeholder:text-slate-600 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-500"
                    placeholder="0"
                    required
                  />
                  <div className="flex flex-wrap gap-1 border-t border-ip bg-slate-50 p-2 dark:border-transparent dark:bg-slate-900/60">
                    {[1, 0.5, 0.25].map((pct) => {
                      const isActive = selectedSellPercentage === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            const amount = selectedAsset.quantity * pct;
                            const value = Number.isInteger(amount)
                              ? amount.toString()
                              : amount.toFixed(4).replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
                            setSellQuantity(value);
                            setSelectedSellPercentage(pct);
                          }}
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${isActive ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "border-ip bg-[var(--ip-nav-hover-bg)] text-ip-muted hover:bg-[var(--ip-sidebar-pro-bg)]"}`}
                        >
                          {Math.round(pct * 100)}%
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-1 text-xs text-ip-subtle">
                  {isFr ? "Maximum" : "Maximum"}: {selectedAsset.quantity}
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-ip-muted">{isFr ? "Prix actuel:" : "Current price:"}</span>
                  <span className="ip-fintech-nums font-semibold text-ip">
                    {formatTndWithUnit(selectedAsset.currentPrice)}
                  </span>
                </div>
                {sellQuantity &&
                  parseFloat(sellQuantity) > 0 && (
                    <div className="flex items-center justify-between border-t border-ip pt-2 dark:border-white/10">
                      <span className="text-sm font-medium text-ip-secondary dark:text-slate-300">
                        {isFr ? "Total de la vente:" : "Sale total:"}
                      </span>
                      <span className="ip-fintech-nums font-bold text-violet-800 dark:text-purple-200">
                        {formatTndWithUnit(parseFloat(sellQuantity) * selectedAsset.currentPrice)}
                      </span>
                    </div>
                  )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSellModal(false);
                    setSelectedSellPercentage(null);
                  }}
                  className="flex-1 rounded-xl border border-ip bg-slate-100/90 px-4 py-2.5 font-medium text-ip transition-colors hover:bg-slate-200/90 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {isFr ? "Annuler" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={tradeBusy}
                  className="hero-cta flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                    {tradeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isFr ? "Vendre" : "Sell"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}