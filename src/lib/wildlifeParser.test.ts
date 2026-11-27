import { isInatResponse, parseSpeciesCount, parseStatus } from "./wildlifeParser";

const item = {
  count: 12,
  taxon: {
    id: 4756,
    name: "Rallus obsoletus",
    preferred_common_name: "Ridgway's Rail",
    iconic_taxon_name: "Aves",
    default_photo: { square_url: "https://example.test/p.jpg" },
  },
};

describe("parseSpeciesCount", () => {
  it("maps an iNaturalist species count to a SpeciesObservation", () => {
    expect(parseSpeciesCount(item)).toEqual({
      taxonId: 4756,
      commonName: "Ridgway's Rail",
      scientificName: "Rallus obsoletus",
      organismType: "Bird",
      imageUrl: "https://example.test/p.jpg",
      status: null,
    });
  });

  it("uses null for a missing common name or photo", () => {
    const parsed = parseSpeciesCount({ taxon: { id: 1, name: "Genus species" } });
    expect(parsed?.commonName).toBeNull();
    expect(parsed?.imageUrl).toBeNull();
    expect(parsed?.organismType).toBe("Other");
  });

  it("skips entries missing an id or scientific name", () => {
    expect(parseSpeciesCount({ taxon: { name: "x" } })).toBeNull();
    expect(parseSpeciesCount({ taxon: { id: 1 } })).toBeNull();
    expect(parseSpeciesCount(null)).toBeNull();
  });

  it("validates the response shape", () => {
    expect(isInatResponse({ results: [] })).toBe(true);
    expect(isInatResponse({ nope: 1 })).toBe(false);
    expect(isInatResponse(null)).toBe(false);
  });
});

describe("parseStatus", () => {
  const species = { taxonId: 4756, scientificName: "Rallus obsoletus" };

  it("builds a status from the matching NatureServe record", () => {
    const status = parseStatus(
      [
        { scientificName: "Other thing", roundedGRank: "G5" },
        { scientificName: "rallus obsoletus", roundedGRank: "G1" },
      ],
      species,
    );
    expect(status).toEqual({
      taxonId: 4756,
      statusCode: "G1",
      statusLabel: "Critically imperiled",
      source: "NatureServe",
    });
  });

  it("returns null (no record, not 'safe') when nothing matches or no rank", () => {
    expect(parseStatus([], species)).toBeNull();
    expect(parseStatus([{ scientificName: "Rallus obsoletus" }], species)).toBeNull();
    expect(parseStatus([{ scientificName: "Rallus obsoletus", roundedGRank: "GNR" }], species)).toBeNull();
    expect(parseStatus("bad", species)).toBeNull();
  });
});
