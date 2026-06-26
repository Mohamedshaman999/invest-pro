import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useMarketData } from "../../contexts/MarketDataContext";
import { investApi } from "../../services/investApi";
import { toast } from "sonner";
import { StockMarketGlassSelect } from "../StockMarketGlassSelect";
import { filterMarketsByCategory, sortMarketsDisplayList } from "../../utils/marketListDisplay";

type Mode = "manual_strategy" | "ai_strategy";

export type WizardFormState = {
  name: string;
  mode: Mode;
  maxAllocation: number;
  maxTransactionsPerDay: number;
  riskLevel: "low" | "medium" | "high";
  assetSymbol: string;
  buyConditionType: "percentage" | "price" | "ai_signal";
  buyThreshold: number;
  useAiBuySignal: boolean;
  sellConditionType: "percentage" | "price" | "ai_signal";
  sellThreshold: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  useAiExit: boolean;
};

const defaultForm = (): WizardFormState => ({
  name: "",
  mode: "manual_strategy",
  maxAllocation: 500,
  maxTransactionsPerDay: 10,
  riskLevel: "medium",
  assetSymbol: "",
  buyConditionType: "percentage",
  buyThreshold: 2,
  useAiBuySignal: false,
  sellConditionType: "percentage",
  sellThreshold: 5,
  stopLossPercent: 4,
  takeProfitPercent: 8,
  useAiExit: false,
});

function riskScorePreview(maxAllocation: number, risk: WizardFormState["riskLevel"]) {
  const base = risk === "high" ? 68 : risk === "medium" ? 45 : 28;
  const bump = Math.min(22, Math.log10(Math.max(1, maxAllocation)) * 5);
  return Math.min(98, Math.round(base + bump));
}

type AssetSelection =
  | string
  | {
      symbol?: string;
      value?: string;
      ticker?: string;
      id?: string;
    }
  | null
  | undefined;

function normalizeAssetSymbol(selection: AssetSelection) {
  const raw =
    typeof selection === "string"
      ? selection
      : selection?.symbol ?? selection?.value ?? selection?.ticker ?? selection?.id ?? "";

  return raw.trim().toUpperCase();
}

export function CreateBotWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { markets, marketsCategoryFilter, marketsSortBy } = useMarketData();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(defaultForm);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [busy, setBusy] = useState(false);

  const sortedMarketOptions = useMemo(() => {
    const filtered = filterMarketsByCategory(markets, marketsCategoryFilter);
    return sortMarketsDisplayList(filtered, marketsSortBy);
  }, [markets, marketsCategoryFilter, marketsSortBy]);

  const selectedAssetSymbol = normalizeAssetSymbol(form.assetSymbol);

  const marketOptionsForDropdown = useMemo(() => {
    const sym = selectedAssetSymbol;
    if (!sym) return sortedMarketOptions;
    const inList = sortedMarketOptions.some((m) => normalizeAssetSymbol(m.symbol) === sym);
    if (inList) return sortedMarketOptions;
    const orphan = markets.find((m) => normalizeAssetSymbol(m.symbol) === sym);
    return orphan ? [orphan, ...sortedMarketOptions] : sortedMarketOptions;
  }, [sortedMarketOptions, selectedAssetSymbol, markets]);

  const score = riskScorePreview(form.maxAllocation, form.riskLevel);
  const canGoNext = step !== 3 || Boolean(selectedAssetSymbol);

  function reset() {
    setStep(1);
    setForm(defaultForm());
    setConfirmRisk(false);
  }

  function goNext() {
    if (step === 3 && !selectedAssetSymbol) {
      toast.error("Choisissez un actif avant de continuer.");
      return;
    }

    setStep((s) => Math.min(5, s + 1));
  }

  async function submit() {
    if (!selectedAssetSymbol) {
      toast.error("Choisissez un symbole d’actif.");
      return;
    }
    if (!confirmRisk) {
      toast.error("Vous devez confirmer avoir pris connaissance des risques.");
      return;
    }
    setBusy(true);
    try {
      await investApi.createAiTradingBot({
        name: form.name.trim() || "Bot IA",
        mode: form.mode,
        maxTransactionsPerDay: form.maxTransactionsPerDay,
        maxAllocation: form.maxAllocation,
        riskLevel: form.riskLevel,
        rules: [
          {
            assetSymbol: selectedAssetSymbol,
            buyConditionType: form.buyConditionType,
            buyThreshold: form.buyThreshold,
            sellConditionType: form.sellConditionType,
            sellThreshold: form.takeProfitPercent,
            stopLossPercent: form.stopLossPercent,
            takeProfitPercent: form.takeProfitPercent,
            useAiBuySignal: form.useAiBuySignal,
            useAiExit: form.useAiExit,
          },
        ],
      });
      toast.success("Bot créé. Vous pouvez le démarrer depuis le panneau de contrôle.");
      onOpenChange(false);
      reset();
      onCreated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Création impossible";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const glass =
    "rounded-2xl border border-cyan-400/15 bg-zinc-950/55 p-5 shadow-[0_0_40px_-12px_rgba(34,211,238,0.25)] backdrop-blur-xl";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(100vw-1.5rem,520px)] -translate-x-1/2 -translate-y-1/2 outline-none">
          <div className={`${glass} max-h-[90vh] overflow-y-auto`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <Dialog.Title className="text-lg font-semibold tracking-tight text-white">
                Assistant de création — bot de trading IA
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Création guidée d’un bot avec contrôle des risques et conditions d’achat ou de vente.
            </Dialog.Description>

            <div className="mb-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition ${s <= step ? "bg-cyan-400/80" : "bg-white/10"}`}
                />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm text-zinc-300">
                  Nom du bot
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-cyan-400/40 focus:ring-2"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ex. Stratégie BVMT prudente"
                  />
                </label>
                <div>
                  <p className="mb-2 text-sm text-zinc-300">Mode</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mode: "manual_strategy" }))}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                        form.mode === "manual_strategy"
                          ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      Stratégie manuelle
                      <span className="mt-1 block text-xs text-zinc-500">Règles explicites (% seuil, prix…)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mode: "ai_strategy" }))}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                        form.mode === "ai_strategy"
                          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                          : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> Stratégie IA
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">Score pondéré (tendance, volatilité…)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="block text-sm text-zinc-300">
                  Budget max par opération (TND)
                  <input
                    type="number"
                    min={10}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-cyan-400/40 focus:ring-2"
                    value={form.maxAllocation}
                    onChange={(e) => setForm((f) => ({ ...f, maxAllocation: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="block text-sm text-zinc-300">
                  Transactions max / jour
                  <input
                    type="number"
                    min={1}
                    max={500}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-cyan-400/40 focus:ring-2"
                    value={form.maxTransactionsPerDay}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxTransactionsPerDay: Number(e.target.value) || 1 }))
                    }
                  />
                </label>
                <div>
                  <p className="mb-2 text-sm text-zinc-300">Niveau de risque</p>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={form.riskLevel === "low" ? 0 : form.riskLevel === "medium" ? 1 : 2}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const risk = v === 0 ? "low" : v === 1 ? "medium" : "high";
                      setForm((f) => ({ ...f, riskLevel: risk }));
                    }}
                    className="w-full accent-cyan-400"
                  />
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>Faible</span>
                    <span>Moyen</span>
                    <span>Élevé</span>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 block text-sm text-zinc-300">Actif (symbole)</p>
                  <StockMarketGlassSelect
                    items={marketOptionsForDropdown}
                    value={selectedAssetSymbol}
                    onChange={(selection: AssetSelection) => {
                      const symbol = normalizeAssetSymbol(selection);
                      setForm((f) => ({ ...f, assetSymbol: symbol }));
                    }}
                    placeholder="— Choisir une action —"
                    listEmptyLabel="Aucun actif pour le filtre Marchés actuel. Ajustez les filtres sur la page Marchés."
                    disabled={busy}
                  />
                  {!selectedAssetSymbol && (
                    <p className="mt-2 text-xs text-amber-200/90">
                      Veuillez choisir un actif pour continuer.
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm text-zinc-300">Condition d’achat</p>
                  <div className="flex flex-wrap gap-2">
                    {(["percentage", "price", "ai_signal"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, buyConditionType: t }))}
                        className={`rounded-lg border px-3 py-1.5 text-xs ${
                          form.buyConditionType === t
                            ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                            : "border-white/10 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {t === "percentage" ? "% baisse" : t === "price" ? "Prix max" : "Signal IA"}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm text-zinc-300">
                  Seuil d’achat (%, ou prix TND selon le mode)
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-cyan-400/40 focus:ring-2"
                    value={form.buyThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, buyThreshold: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.useAiBuySignal}
                    onChange={(e) => setForm((f) => ({ ...f, useAiBuySignal: e.target.checked }))}
                    className="size-4 rounded border-white/20 bg-black/40 accent-cyan-400"
                  />
                  Renforcer avec signal IA (mode manuel)
                </label>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <label className="block text-sm text-zinc-300">
                  Take profit (%)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-emerald-400/40 focus:ring-2"
                    value={form.takeProfitPercent}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        takeProfitPercent: Number(e.target.value) || 0,
                        sellThreshold: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-zinc-300">
                  Stop loss (%)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none ring-rose-400/40 focus:ring-2"
                    value={form.stopLossPercent}
                    onChange={(e) => setForm((f) => ({ ...f, stopLossPercent: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.useAiExit}
                    onChange={(e) => setForm((f) => ({ ...f, useAiExit: e.target.checked }))}
                    className="size-4 rounded border-white/20 bg-black/40 accent-emerald-400"
                  />
                  Sortie assistée par IA
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-zinc-400">
                  <p className="mb-2 font-medium text-amber-200/90">Avertissement risque</p>
                  Le trading automatisé comporte un risque de perte en capital. Les performances passées ne
                  préjugent pas des résultats futurs. Le moteur s’appuie sur des données de marché qui peuvent être
                  indisponibles ou retardées.
                </div>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <p className="text-xs text-zinc-400">Score de risque estimé (indicatif)</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-cyan-200">{score}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Basé sur le plafond par trade, le niveau de risque et la fréquence max.
                  </p>
                </div>
                <ul className="space-y-1 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                  <li>
                    <span className="text-zinc-500">Nom :</span> {form.name || "—"}
                  </li>
                  <li>
                    <span className="text-zinc-500">Mode :</span>{" "}
                    {form.mode === "ai_strategy" ? "IA" : "Manuel"}
                  </li>
                  <li>
                    <span className="text-zinc-500">Max / trade :</span> {form.maxAllocation} TND
                  </li>
                  <li>
                    <span className="text-zinc-500">Actif :</span> {selectedAssetSymbol || "—"}
                  </li>
                </ul>
                <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={confirmRisk}
                    onChange={(e) => setConfirmRisk(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-white/20 bg-black/40 accent-cyan-400"
                  />
                  Je confirme avoir lu l’avertissement et accepter le lancement ultérieur du bot sous ma
                  responsabilité.
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-between gap-2">
              <button
                type="button"
                disabled={step === 1 || busy}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Retour
              </button>
              {step < 5 ? (
                <button
                  type="button"
                  disabled={busy || !canGoNext}
                  onClick={goNext}
                  className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-500/90 to-emerald-500/80 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Suivant <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="rounded-xl bg-gradient-to-r from-emerald-500/90 to-cyan-500/80 px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                >
                  {busy ? "Création…" : "Créer le bot"}
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
