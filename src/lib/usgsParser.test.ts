import { UsgsFeature, parseFeature, pickLatest } from "./usgsParser";
import { Measurement } from "./types";

function feature(overrides: Partial<UsgsFeature["properties"]> = {}): UsgsFeature {
  return {
    properties: {
      monitoring_location_id: "USGS-11162765",
      parameter_code: "00010",
      time: "2026-11-02T01:45:00+00:00",
      value: "18.1",
      unit_of_measure: "degC",
      ...overrides,
    },
  };
}

describe("parseFeature", () => {
  it("turns a USGS reading into a Measurement", () => {
    const m = parseFeature(feature());
    expect(m).toMatchObject({
      stationId: "USGS-11162765",
      parameterCode: "00010",
      parameterName: "Water temperature",
      value: 18.1,
      unit: "°C",
    });
    expect(m?.collectedAt.toISOString()).toBe("2026-11-02T01:45:00.000Z");
    expect(m?.sourceUrl).toBe("https://waterdata.usgs.gov/monitoring-location/USGS-11162765/");
  });

  it("formats USGS units for display", () => {
    expect(parseFeature(feature({ parameter_code: "63680", unit_of_measure: "_FNU" }))?.unit).toBe("FNU");
    expect(parseFeature(feature({ parameter_code: "00300", unit_of_measure: "mg/l" }))?.unit).toBe("mg/L");
  });

  it("returns null for a parameter we do not show", () => {
    expect(parseFeature(feature({ parameter_code: "00095" }))).toBeNull();
  });

  it("returns null when the value is missing, never 0", () => {
    expect(parseFeature(feature({ value: null }))).toBeNull();
    expect(parseFeature(feature({ value: "  " }))).toBeNull();
  });

  it("returns null when the value is not a number", () => {
    expect(parseFeature(feature({ value: "abc" }))).toBeNull();
  });
});

describe("pickLatest", () => {
  function m(code: string, value: number, iso: string): Measurement {
    return {
      stationId: "S",
      parameterCode: code,
      parameterName: code,
      value,
      unit: "u",
      collectedAt: new Date(iso),
      sourceUrl: "",
    };
  }

  it("keeps the newest reading for each parameter", () => {
    const result = pickLatest([
      m("00010", 1, "2026-11-01T00:00:00Z"),
      m("00010", 2, "2026-11-02T00:00:00Z"),
      m("63680", 3, "2026-11-01T00:00:00Z"),
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((x) => x.parameterCode === "00010")?.value).toBe(2);
  });

  it("keeps the first reading when two have the same time", () => {
    const result = pickLatest([
      m("63680", 16.8, "2026-11-02T01:45:00Z"),
      m("63680", 5.2, "2026-11-02T01:45:00Z"),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(16.8);
  });

  it("returns an empty list for no measurements", () => {
    expect(pickLatest([])).toEqual([]);
  });
});
