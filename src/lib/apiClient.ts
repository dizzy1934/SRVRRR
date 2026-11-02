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
    // 3. Send the request with fetch
    // 4. If the response is not OK, throw an ApiFault (kind "http")
    // 5. Parse the body as JSON; if that fails, throw an ApiFault (kind "malformed")
    // 6. Return the parsed body
    // 7. If the timer cancelled it, throw kind "timeout"; any other failure, "network"
    // 8. Always stop the timer at the end
    throw new Error(`not implemented yet: ${url}`);
  }
}

