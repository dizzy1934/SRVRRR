import { StationService } from "./stationService";
import { StationRepository } from "../repositories/stationRepository";

describe("StationService", () => {
  const service = new StationService(new StationRepository());

  it("lists every station", async () => {
    expect((await service.listStations()).length).toBeGreaterThan(0);
  });

  it("finds a station by id and returns null for an unknown id", async () => {
    const all = await service.listStations();
    expect((await service.getById(all[0].stationId))?.name).toBe(all[0].name);
    expect(await service.getById("nope")).toBeNull();
  });

  it("searches by name ignoring case and spaces", async () => {
    const all = await service.listStations();
    const word = all[0].name.split(" ")[0].toUpperCase();
    const found = await service.search(`  ${word} `);
    expect(found.map((s) => s.stationId)).toContain(all[0].stationId);
  });

  it("returns every station for an empty search and none for no match", async () => {
    const all = await service.listStations();
    expect(await service.search("")).toHaveLength(all.length);
    expect(await service.search("zzzz-no-such-place")).toEqual([]);
  });
});
