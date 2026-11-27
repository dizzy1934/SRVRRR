// Small helpers shared by the unit tests. No live services are ever called.

import { ApiClient } from "../apiClient";

export function fakeResponse(body: unknown, status = 200, badJson = false): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (badJson) throw new SyntaxError("Unexpected token");
      return body;
    },
  } as unknown as Response;
}

// An ApiClient whose "network" is a function we control.
export function clientReturning(
  respond: (url: string, init?: RequestInit) => Promise<Response>,
  provider = "TestProvider",
  timeoutMs = 5000,
): ApiClient {
  return new ApiClient({
    baseUrl: "https://example.test/api/",
    provider,
    timeoutMs,
    fetchImpl: respond as unknown as typeof fetch,
  });
}
