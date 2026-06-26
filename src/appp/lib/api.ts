/** If VITE_API_URL is an origin only (e.g. http://localhost:4000), append /api to match Express mount. */
function normalizeConfiguredBase(raw: string): string {
  const s = raw.trim().replace(/\/$/, "");
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.pathname === "" || u.pathname === "/") {
      return `${u.origin}/api`;
    }
    return `${u.origin}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return s;
  }
}

function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === "string" && raw.trim()) {
    return normalizeConfiguredBase(raw);
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return "http://localhost:4000/api";
}

const BASE = getApiBase();

export const TOKEN_KEY = "token";
export const REFRESH_KEY = "refreshToken";

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("user");
}

export class ApiError extends Error {
  status: number;
  /** Server `code` when present (e.g. INVALID_RESET). */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Fiabilise les `catch` (bundlers / doubles instances peuvent casser `instanceof ApiError`). */
export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as ApiError).name === "ApiError" &&
    typeof (e as ApiError).status === "number" &&
    typeof (e as ApiError).message === "string"
  );
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageFromErrorBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  if (Array.isArray(o.message) && o.message.length > 0) {
    const first = o.message[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  const details = o.details;
  if (Array.isArray(details) && details[0] && typeof details[0] === "object") {
    const d = details[0] as { message?: string };
    if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
  }
  return null;
}

async function tryRefresh(): Promise<boolean> {
  const rt = localStorage.getItem(REFRESH_KEY);
  if (!rt) return false;
  let res: Response;
  try {
    res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
  } catch {
    return false;
  }
  if (!res.ok) return false;
  const data = (await parseBody(res)) as { accessToken?: string; refreshToken?: string } | null;
  if (!data?.accessToken || !data?.refreshToken) return false;
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  return true;
}

function shouldRedirectToLogin() {
  const p = window.location.pathname;
  return (
    !p.includes("/login") &&
    !p.includes("/register") &&
    !p.includes("/forgot-password") &&
    !p.includes("/reset-password")
  );
}

export type ApiFetchOptions = {
  skipAuth?: boolean;
  _retry?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  opts: ApiFetchOptions = {}
): Promise<T> {
  const rel = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE}${rel}`;
  const headers = new Headers(init.headers);
  if (!opts.skipAuth) {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  if (init.body != null && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Start the backend on port 4000 (folder backend: npm run dev). With Vite, leave VITE_API_URL unset so /api is proxied, or set it to the full API URL.",
      0
    );
  }

  if (res.status === 401 && !opts.skipAuth && !opts._retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, init, { ...opts, _retry: true });
    }
    clearAuthStorage();
    if (shouldRedirectToLogin()) {
      window.location.assign("/login");
    }
    throw new ApiError("Session expired or unauthorized. Please sign in again.", 401);
  }

  if (!res.ok) {
    const rawText = await res.text();
    let errBody: unknown = null;
    if (rawText.trim()) {
      try {
        errBody = JSON.parse(rawText);
      } catch {
        errBody = null;
      }
    }
    const serverMsg = messageFromErrorBody(errBody);
    const trimmedRaw = rawText.replace(/\s+/g, " ").trim();
    const nonJsonSnippet =
      !serverMsg && trimmedRaw && !errBody && !trimmedRaw.startsWith("<") ? trimmedRaw.slice(0, 200) : "";
    const statusFallback = `Request failed (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}).`;
    const fallbackMsg = serverMsg || nonJsonSnippet || statusFallback;
    const errCode =
      errBody && typeof errBody === "object" && typeof (errBody as Record<string, unknown>).code === "string"
        ? String((errBody as Record<string, unknown>).code)
        : undefined;
    if (res.status === 401 && opts.skipAuth) {
      throw new ApiError(serverMsg || nonJsonSnippet || "Invalid email or password", 401, errCode);
    }
    if (res.status === 401) {
      clearAuthStorage();
      if (shouldRedirectToLogin()) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(fallbackMsg, res.status, errCode);
  }

  const data = (await parseBody(res)) as T | null;
  return data as T;
}

function parseContentDispositionFilename(cd: string | null): string | null {
  if (!cd) return null;
  const utf8Star = /filename\*\s*=\s*UTF-8''([^;\s]+)/i.exec(cd);
  if (utf8Star?.[1]) {
    try {
      return decodeURIComponent(utf8Star[1].replace(/^"+|"+$/g, "").trim());
    } catch {
      return utf8Star[1].trim();
    }
  }
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(cd);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename\s*=\s*([^;\s]+)/i.exec(cd);
  return plain?.[1]?.replace(/^"+|"+$/g, "").trim() ?? null;
}

export type UserExportReportResult =
  | { kind: "pdf"; blob: Blob; filename: string }
  | { kind: "error"; status: number; message: string; code?: string };

/** GET /user/export-data-report — PDF ou erreur JSON (ex. NO_PORTFOLIO_DATA). */
export async function fetchUserExportDataReport(): Promise<UserExportReportResult> {
  const url = `${BASE}/user/export-data-report`;
  const headers = new Headers();
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) headers.set("Authorization", `Bearer ${t}`);

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers });
  } catch {
    return {
      kind: "error",
      status: 0,
      message:
        "Cannot reach the API. Start the backend on port 4000 (folder backend: npm run dev). With Vite, leave VITE_API_URL unset so /api is proxied, or set it to the full API URL.",
    };
  }

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const h2 = new Headers();
      const t2 = localStorage.getItem(TOKEN_KEY);
      if (t2) h2.set("Authorization", `Bearer ${t2}`);
      res = await fetch(url, { method: "GET", headers: h2 });
    }
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  /** Express envoie souvent les Buffer en `application/octet-stream` même si on a fixé le PDF : détection fiable. */
  function isPdfMagic(buf: ArrayBuffer) {
    const u8 = new Uint8Array(buf);
    return u8.length >= 4 && u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46;
  }

  if (res.ok) {
    const buf = await res.arrayBuffer();
    if (isPdfMagic(buf) || ct.includes("application/pdf")) {
      const blob = new Blob([buf], { type: "application/pdf" });
      const name = parseContentDispositionFilename(res.headers.get("content-disposition"));
      return { kind: "pdf", blob, filename: name || "investpro-investment-report.pdf" };
    }
    let errBody: unknown = null;
    try {
      errBody = JSON.parse(new TextDecoder().decode(buf)) as unknown;
    } catch {
      errBody = null;
    }
    const serverMsg = messageFromErrorBody(errBody);
    const errCode =
      errBody && typeof errBody === "object" && typeof (errBody as Record<string, unknown>).code === "string"
        ? String((errBody as Record<string, unknown>).code)
        : undefined;
    return {
      kind: "error",
      status: res.status,
      message: serverMsg || "Something went wrong",
      code: errCode,
    };
  }

  const errBody = await parseBody(res);
  const serverMsg = messageFromErrorBody(errBody);
  const errCode =
    errBody && typeof errBody === "object" && typeof (errBody as Record<string, unknown>).code === "string"
      ? String((errBody as Record<string, unknown>).code)
      : undefined;
  if (res.status === 401) {
    clearAuthStorage();
    if (shouldRedirectToLogin()) {
      window.location.assign("/login");
    }
  }
  return {
    kind: "error",
    status: res.status,
    message: serverMsg || "Something went wrong",
    code: errCode,
  };
}
