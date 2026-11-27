// ApiClient: the single place that makes outbound HTTP calls (SFDS 5.2.2).
// - aborts at timeoutMs (default 5000, SFDS Design Goal 2.2)
// - checks the response shape when a validator is supplied
// - throws a typed ApiFault on timeout, non-2xx status, network error,
//   or malformed payload, so services never handle raw fetch errors.

import { ApiFault, FaultKind } from "./types";

export type QueryParams = Record<string, string | number | undefined>;

// A "type guard": returns true only if the body really has the shape T.
export type Validator<T> = (body: unknown) => body is T;

export interface ApiClientOptions {
  baseUrl: string;
  provider: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  // Injectable so tests can simulate timeouts and bad payloads (SFDS 11.1).
  fetchImpl?: typeof fetch;
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "AbortError"
  );
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly provider: string;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.provider = options.provider;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.headers = options.headers ?? {};
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async get<T>(path: string, params: QueryParams = {}, validate?: Validator<T>): Promise<T> {
    return this.request<T>(path, params, { method: "GET" }, validate);
  }

  // Used for NatureServe's search endpoint, which takes a JSON body.
  async post<T>(path: string, body: unknown, validate?: Validator<T>): Promise<T> {
    return this.request<T>(
      path,
      {},
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
      validate,
    );
  }

  private async request<T>(
    path: string,
    params: QueryParams,
    init: { method: string; body?: string; headers?: Record<string, string> },
    validate?: Validator<T>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: init.method,
        body: init.body,
        signal: controller.signal,
        headers: { Accept: "application/json", ...this.headers, ...init.headers },
      });

      if (!response.ok) {
        throw this.fault("http", path, response.status);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (err) {
        if (isAbortError(err)) throw err; // handled below as a timeout
        throw this.fault("malformed", path, response.status);
      }

      if (validate && !validate(body)) {
        throw this.fault("malformed", path, response.status);
      }
      return body as T;
    } catch (err) {
      if (err instanceof ApiFault) throw err;
      if (isAbortError(err)) throw this.fault("timeout", path);
      throw this.fault("network", path);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, params: QueryParams): string {
    const url = new URL(`${this.baseUrl}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private fault(kind: FaultKind, resource: string, httpStatus?: number): ApiFault {
    return new ApiFault({ provider: this.provider, resource, kind, httpStatus });
  }
}
