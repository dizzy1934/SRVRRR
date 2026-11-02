import { ApiFault, FaultKind } from "./types";

export type QueryParams = Record<string, string | number | undefined>;

export function buildUrl(baseUrl: string, path: string, params: QueryParams): string {
  const joined = `${baseUrl}/${path.replace(/^\/+/, "")}`;
  const url = new URL(joined);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "AbortError"
  );
}

export interface ApiClientOptions {
  baseUrl: string;
  provider: string;
  timeoutMs?: number;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly provider: string;
  private readonly timeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.provider = options.provider;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async get<T>(path: string, params: QueryParams = {}): Promise<T> {
    // 1. Build the full URL from baseUrl, path, and params
    const url = buildUrl(this.baseUrl, path, params);

    // 2. Start a timer that cancels the request after timeoutMs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // 3. Send the request with fetch
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      // 4. If the response is not OK, throw an ApiFault (kind "http")
      if (!response.ok) {
        throw this.fault("http", path, response.status);
      }

      // 5. Parse the body as JSON; if that fails, throw an ApiFault (kind "malformed")
      try {
        // 6. Return the parsed body
        return (await response.json()) as T;
      } catch (err) {
        if (isAbortError(err)) throw err;
        throw this.fault("malformed", path, response.status);
      }
    } catch (err) {
      // 7. If the timer cancelled it, throw kind "timeout"; any other failure, "network"
      if (err instanceof ApiFault) throw err;
      if (isAbortError(err)) throw this.fault("timeout", path);
      throw this.fault("network", path);
    } finally {
      // 8. Always stop the timer at the end
      clearTimeout(timer);
    }
  }

  private fault(kind: FaultKind, resource: string, httpStatus?: number): ApiFault {
    return new ApiFault({ provider: this.provider, resource, kind, httpStatus });
  }
}

