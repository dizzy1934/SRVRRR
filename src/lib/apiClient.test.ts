// ApiClient (SFDS 11.1): success, HTTP error, malformed payload, network error,
// and a request exceeding the timeout.

import { ApiFault } from "./types";
import { clientReturning, fakeResponse } from "./testing/helpers";

describe("ApiClient", () => {
  it("returns the parsed body and builds the URL with query params", async () => {
    const seen: string[] = [];
    const client = clientReturning(async (url) => {
      seen.push(url);
      return fakeResponse({ ok: true });
    });

    const body = await client.get<{ ok: boolean }>("/items", { station: "A1", skip: undefined });

    expect(body).toEqual({ ok: true });
    expect(seen[0]).toBe("https://example.test/api/items?station=A1");
  });

  it("throws an http fault with the status code on a non-2xx response", async () => {
    const client = clientReturning(async () => fakeResponse({}, 500));
    await expect(client.get("/items")).rejects.toMatchObject({
      name: "ApiFault",
      kind: "http",
      httpStatus: 500,
      provider: "TestProvider",
    });
  });

  it("throws a malformed fault when the body is not valid JSON", async () => {
    const client = clientReturning(async () => fakeResponse(null, 200, true));
    await expect(client.get("/items")).rejects.toMatchObject({ kind: "malformed" });
  });

  it("throws a malformed fault when the validator rejects the body", async () => {
    const client = clientReturning(async () => fakeResponse({ wrong: 1 }));
    const hasRecords = (b: unknown): b is { records: unknown[] } =>
      typeof b === "object" && b !== null && Array.isArray((b as { records?: unknown }).records);
    await expect(client.get("/items", {}, hasRecords)).rejects.toMatchObject({ kind: "malformed" });
  });

  it("accepts a body the validator approves", async () => {
    const client = clientReturning(async () => fakeResponse({ records: [1] }));
    const hasRecords = (b: unknown): b is { records: unknown[] } =>
      typeof b === "object" && b !== null && Array.isArray((b as { records?: unknown }).records);
    await expect(client.get("/items", {}, hasRecords)).resolves.toEqual({ records: [1] });
  });

  it("throws a network fault when fetch itself fails", async () => {
    const client = clientReturning(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(client.get("/items")).rejects.toBeInstanceOf(ApiFault);
    await expect(client.get("/items")).rejects.toMatchObject({ kind: "network" });
  });

  it("aborts at the timeout and throws a timeout fault", async () => {
    // A fetch that never answers unless it is aborted, like a hung provider.
    // A short real timeout keeps the test simple and fast.
    const client = clientReturning(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
      "TestProvider",
      30,
    );
    await expect(client.get("/items")).rejects.toMatchObject({ kind: "timeout" });
  });

  it("sends a JSON body on POST", async () => {
    let sent: RequestInit | undefined;
    const client = clientReturning(async (_url, init) => {
      sent = init;
      return fakeResponse({ results: [] });
    });
    await client.post("/search", { a: 1 });
    expect(sent?.method).toBe("POST");
    expect(sent?.body).toBe('{"a":1}');
  });
});
