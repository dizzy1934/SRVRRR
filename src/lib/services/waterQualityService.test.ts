import { WaterQualityService } from "./waterQualityService";
import { FallbackService } from "./fallbackService";
import { ExplanationStore } from "../repositories/explanationStore";
import { clientReturning, fakeResponse } from "../testing/helpers";

function feature(code: string, value: string | null, time: string, unit = "degC") {
  return {
    properties: {
      monitoring_location_id: "USGS-1",
      parameter_code: code,
      time,
      value,
      unit_of_measure: unit,
    },
  };
}

function makeService(respond: Parameters<typeof clientReturning>[0]) {
  return new WaterQualityService(
    clientReturning(respond, "USGS"),
    new FallbackService(),
    new ExplanationStore(),
  );
}

describe("WaterQualityService", () => {
  it("returns the newest reading per parameter with explanations attached", async () => {
    const service = makeService(async () =>
      fakeResponse({
        features: [
          feature("00010", "17.0", "2026-11-01T00:00:00Z"),
          feature("00010", "18.1", "2026-11-02T00:00:00Z"),
          feature("00300", null, "2026-11-02T00:00:00Z", "mg/l"),
          feature("00095", "47000", "2026-11-02T00:00:00Z", "uS/cm"),
        ],
      }),
    );

    const result = await service.getMeasurements("USGS-1");

    expect(result.isFallback).toBe(false);
    expect(result.message).toBeNull();
    expect(result.data).toHaveLength(1); // null value and unlisted parameter dropped
    expect(result.data[0].value).toBe(18.1);
    expect(result.data[0].explanation).toBeDefined();
  });

  it("asks USGS for the station with limit 100", async () => {
    let url = "";
    const service = makeService(async (u) => {
      url = u;
      return fakeResponse({ features: [] });
    });
    await service.getMeasurements("USGS-1");
    expect(url).toContain("monitoring_location_id=USGS-1");
    expect(url).toContain("limit=100");
  });

  it("returns a fallback result when USGS is down", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const service = makeService(async () => fakeResponse({}, 503));
    const result = await service.getMeasurements("USGS-1");
    expect(result).toMatchObject({ data: [], isFallback: true });
    expect(result.message).toBe("Water quality data is currently unavailable.");
    spy.mockRestore();
  });

  it("treats an unexpected response shape as a fallback, not a crash", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const service = makeService(async () => fakeResponse({ features: 5 }));
    const result = await service.getMeasurements("USGS-1");
    expect(result.isFallback).toBe(true);
    spy.mockRestore();
  });
});
