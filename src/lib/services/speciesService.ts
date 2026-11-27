import { ApiClient } from "../apiClient";
import { ApiFault, DataResult, MonitoringStation, SpeciesObservation } from "../types";
import {
  isInatResponse,
  isNatureServeResponse,
  parseSpeciesCount,
  parseStatus,
} from "../wildlifeParser";
import { FallbackService } from "./fallbackService";

// How far from the station to look for sightings, and how many species to show.
const RADIUS_KM = 5;
const MAX_SPECIES = 10;

// Bay-relevant groups only (birds, mammals, fish, reptiles, amphibians).
const ICONIC_TAXA = "Aves,Mammalia,Actinopterygii,Reptilia,Amphibia";

// Shown when NatureServe fails but the sightings loaded fine.
const STATUS_UNAVAILABLE = "Conservation status data is currently unavailable.";

export class SpeciesService {
  private readonly inat: ApiClient;
  private readonly natureServe: ApiClient;
  private readonly fallback: FallbackService;

  constructor(inat: ApiClient, natureServe: ApiClient, fallback: FallbackService) {
    this.inat = inat;
    this.natureServe = natureServe;
    this.fallback = fallback;
  }

  // SFDS Algorithm A3. Never throws for a provider failure: the wildlife panel
  // must fail on its own without taking the water cards down (TC-006).
  async getSpecies(station: MonitoringStation): Promise<DataResult<SpeciesObservation[]>> {
    // 1. Ask iNaturalist which species were seen near the station
    let species: SpeciesObservation[];
    try {
      const response = await this.inat.get(
        "observations/species_counts",
        {
          lat: station.latitude,
          lng: station.longitude,
          radius: RADIUS_KM,
          iconic_taxa: ICONIC_TAXA,
          quality_grade: "research",
          per_page: MAX_SPECIES,
          locale: "en",
        },
        isInatResponse,
      );

      species = [];
      for (const item of response.results) {
        const parsed = parseSpeciesCount(item);
        if (parsed !== null) species.push(parsed);
      }
    } catch (err) {
      if (err instanceof ApiFault) {
        return this.fallback.handle<SpeciesObservation[]>(err, []);
      }
      throw err;
    }

    // 2. Look up each species' conservation status. A failure here only
    //    leaves that species' status empty; the sightings still show.
    let statusFailed = false;
    const withStatus = await Promise.all(
      species.map(async (s) => {
        try {
          const found = await this.natureServe.post(
            "data/speciesSearch",
            {
              criteriaType: "species",
              textCriteria: [
                { paramType: "quickSearch", searchToken: s.scientificName },
              ],
            },
            isNatureServeResponse,
          );
          return { ...s, status: parseStatus(found.results, s) };
        } catch (err) {
          if (err instanceof ApiFault) {
            if (!statusFailed) this.fallback.logFailure(err); // log once, not ten times
            statusFailed = true;
            return s;
          }
          throw err;
        }
      }),
    );

    // 3. Wrap and return
    return {
      data: withStatus,
      isFallback: false,
      retrievedAt: new Date(),
      message: statusFailed ? STATUS_UNAVAILABLE : null,
    };
  }
}
