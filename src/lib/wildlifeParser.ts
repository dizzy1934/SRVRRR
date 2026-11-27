// Turns iNaturalist and NatureServe responses into our own types (SFDS A3).
// Everything here is a pure function so it can be unit tested without the network.

import { ConservationStatus, SpeciesObservation } from "./types";

// ---------- iNaturalist: GET /v1/observations/species_counts ----------

export interface InatSpeciesCount {
  count: number;
  taxon: {
    id: number;
    name: string; // scientific name
    preferred_common_name?: string | null;
    iconic_taxon_name?: string | null;
    default_photo?: { square_url?: string | null } | null;
  };
}

export interface InatResponse {
  results: InatSpeciesCount[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isInatResponse(body: unknown): body is InatResponse {
  return isRecord(body) && Array.isArray(body.results);
}

const ORGANISM_TYPES: Record<string, string> = {
  Aves: "Bird",
  Mammalia: "Mammal",
  Reptilia: "Reptile",
  Amphibia: "Amphibian",
  Actinopterygii: "Fish",
  Mollusca: "Mollusk",
  Insecta: "Insect",
  Plantae: "Plant",
};

export function parseSpeciesCount(item: unknown): SpeciesObservation | null {
  if (!isRecord(item) || !isRecord(item.taxon)) return null;
  const taxon = item.taxon;

  // A species without an id or a scientific name cannot be shown or looked up.
  if (typeof taxon.id !== "number") return null;
  if (typeof taxon.name !== "string" || taxon.name.trim() === "") return null;

  const common =
    typeof taxon.preferred_common_name === "string" && taxon.preferred_common_name.trim() !== ""
      ? taxon.preferred_common_name
      : null;

  const iconic = typeof taxon.iconic_taxon_name === "string" ? taxon.iconic_taxon_name : "";
  const photo = isRecord(taxon.default_photo) ? taxon.default_photo.square_url : null;

  return {
    taxonId: taxon.id,
    commonName: common,
    scientificName: taxon.name,
    organismType: ORGANISM_TYPES[iconic] ?? "Other",
    imageUrl: typeof photo === "string" && photo !== "" ? photo : null,
    status: null, // filled in later from NatureServe
  };
}

// ---------- NatureServe: POST /api/data/speciesSearch ----------

export interface NatureServeResult {
  scientificName: string;
  roundedGRank?: string | null;
}

export interface NatureServeResponse {
  results: NatureServeResult[];
}

export function isNatureServeResponse(body: unknown): body is NatureServeResponse {
  return isRecord(body) && Array.isArray(body.results);
}

// NatureServe global ranks: G1 is the most at risk, G5 the least (NatureServe rank system).
const RANK_LABELS: Record<string, string> = {
  G1: "Critically imperiled",
  G2: "Imperiled",
  G3: "Vulnerable",
  G4: "Apparently secure",
  G5: "Secure",
  GX: "Presumed extinct",
  GH: "Possibly extinct",
};

// Picks the record whose scientific name matches ours and builds a ConservationStatus.
// Returns null when there is no match or no usable rank: null means "no record",
// which is NOT the same as "not at risk" (SFDS 4.3).
export function parseStatus(
  results: unknown,
  species: Pick<SpeciesObservation, "taxonId" | "scientificName">,
): ConservationStatus | null {
  if (!Array.isArray(results)) return null;
  const wanted = species.scientificName.trim().toLowerCase();

  for (const row of results) {
    if (!isRecord(row)) continue;
    if (typeof row.scientificName !== "string") continue;
    if (row.scientificName.trim().toLowerCase() !== wanted) continue;

    const rank = typeof row.roundedGRank === "string" ? row.roundedGRank.trim().toUpperCase() : "";
    const label = RANK_LABELS[rank];
    if (label === undefined) return null; // unranked or a code we do not describe

    return {
      taxonId: species.taxonId,
      statusCode: rank,
      statusLabel: label,
      source: "NatureServe",
    };
  }
  return null;
}
