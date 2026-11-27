import { SpeciesService } from "./speciesService";
import { FallbackService } from "./fallbackService";
import { clientReturning, fakeResponse } from "../testing/helpers";
import { MonitoringStation } from "../types";

const station: MonitoringStation = {
  stationId: "USGS-1",
  name: "Test station",
  latitude: 37.5844,
  longitude: -122.2508,
  dataSource: "USGS",
};

const inatBody = {
  results: [
    { count: 3, taxon: { id: 1, name: "Rallus obsoletus", preferred_common_name: "Ridgway's Rail", iconic_taxon_name: "Aves" } },
    { count: 2, taxon: { id: 2, name: "Ardea herodias", preferred_common_name: "Great Blue Heron", iconic_taxon_name: "Aves" } },
  ],
};

function makeService(
  inat: Parameters<typeof clientReturning>[0],
  ns: Parameters<typeof clientReturning>[0],
) {
  return new SpeciesService(
    clientReturning(inat, "iNaturalist"),
    clientReturning(ns, "NatureServe"),
    new FallbackService(),
  );
}

describe("SpeciesService", () => {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    spy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => spy.mockRestore());

  it("returns species with conservation status where NatureServe has one", async () => {
    const service = makeService(
      async () => fakeResponse(inatBody),
      async (_u, init) => {
        const name = JSON.parse(String(init?.body)).textCriteria[0].searchToken;
        return fakeResponse({
          results: name === "Rallus obsoletus" ? [{ scientificName: name, roundedGRank: "G1" }] : [],
        });
      },
    );

    const result = await service.getSpecies(station);

    expect(result.isFallback).toBe(false);
    expect(result.message).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].status?.statusCode).toBe("G1");
    expect(result.data[1].status).toBeNull();
  });

  it("queries iNaturalist near the station", async () => {
    let url = "";
    const service = makeService(
      async (u) => {
        url = u;
        return fakeResponse({ results: [] });
      },
      async () => fakeResponse({ results: [] }),
    );
    await service.getSpecies(station);
    expect(url).toContain("lat=37.5844");
    expect(url).toContain("lng=-122.2508");
    expect(url).toContain("radius=5");
  });

  it("returns a fallback result when iNaturalist fails", async () => {
    const service = makeService(
      async () => fakeResponse({}, 500),
      async () => fakeResponse({ results: [] }),
    );
    const result = await service.getSpecies(station);
    expect(result).toMatchObject({ data: [], isFallback: true });
    expect(result.message).toBe("Wildlife data is currently unavailable.");
  });

  it("treats an unexpected iNaturalist shape as a fault, not a crash", async () => {
    const service = makeService(
      async () => fakeResponse({ surprise: true }),
      async () => fakeResponse({ results: [] }),
    );
    const result = await service.getSpecies(station);
    expect(result.isFallback).toBe(true);
  });

  it("still shows sightings, with empty status and a notice, when NatureServe fails", async () => {
    const service = makeService(
      async () => fakeResponse(inatBody),
      async () => fakeResponse({}, 500),
    );
    const result = await service.getSpecies(station);
    expect(result.isFallback).toBe(false);
    expect(result.data).toHaveLength(2);
    expect(result.data.every((s) => s.status === null)).toBe(true);
    expect(result.message).toBe("Conservation status data is currently unavailable.");
    expect(spy).toHaveBeenCalledTimes(1); // logged once, not once per species
  });
});
