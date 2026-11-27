import { FallbackService } from "./fallbackService";
import { ApiFault } from "../types";

describe("FallbackService", () => {
  const service = new FallbackService();

  it("returns empty data flagged as fallback with a friendly message", () => {
    const fault = new ApiFault({ provider: "USGS", resource: "x", kind: "http", httpStatus: 503 });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = service.handle<number[]>(fault, []);

    expect(result.data).toEqual([]);
    expect(result.isFallback).toBe(true);
    expect(result.message).toBe("Water quality data is currently unavailable.");
    spy.mockRestore();
  });

  it("uses a timeout-specific message", () => {
    const fault = new ApiFault({ provider: "iNaturalist", resource: "x", kind: "timeout" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(service.handle(fault, []).message).toBe(
      "Wildlife data took too long to load. Please try again in a moment.",
    );
    spy.mockRestore();
  });

  it("falls back to a generic label for an unknown provider", () => {
    const fault = new ApiFault({ provider: "Other", resource: "x", kind: "network" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(service.handle(fault, []).message).toBe("Some data is currently unavailable.");
    spy.mockRestore();
  });

  it("logs one line with no stack trace", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    service.logFailure(new ApiFault({ provider: "USGS", resource: "r", kind: "http", httpStatus: 500 }));
    const line = String(spy.mock.calls[0][0]);
    expect(line).toContain("provider=USGS");
    expect(line).toContain("kind=http");
    expect(line).toContain("status=500");
    expect(line).not.toContain("\n");
    spy.mockRestore();
  });
});
