import { ApiClient } from "./apiClient";
import { ExplanationStore } from "./repositories/explanationStore";
import { StationRepository } from "./repositories/stationRepository";
import { FallbackService } from "./services/fallbackService";
import { SpeciesService } from "./services/speciesService";
import { StationService } from "./services/stationService";
import { WaterQualityService } from "./services/waterQualityService";

export const stationService = new StationService(new StationRepository());

export const waterQualityService = new WaterQualityService(
  new ApiClient({ baseUrl: "https://api.waterdata.usgs.gov/ogcapi/v1", provider: "USGS" }),
  new FallbackService(),
  new ExplanationStore(),
);

// iNaturalist's read-only API needs no key. NatureServe's access terms are still
// unconfirmed (see README), so a failure there only hides conservation status.
export const speciesService = new SpeciesService(
  new ApiClient({ baseUrl: "https://api.inaturalist.org/v1", provider: "iNaturalist" }),
  new ApiClient({ baseUrl: "https://explorer.natureserve.org/api", provider: "NatureServe" }),
  new FallbackService(),
);
