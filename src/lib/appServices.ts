import { ApiClient } from "./apiClient";
import { ExplanationStore } from "./repositories/explanationStore";
import { StationRepository } from "./repositories/stationRepository";
import { FallbackService } from "./services/fallbackService";
import { StationService } from "./services/stationService";
import { WaterQualityService } from "./services/waterQualityService";

export const stationService = new StationService(new StationRepository());

export const waterQualityService = new WaterQualityService(
  new ApiClient({ baseUrl: "https://api.waterdata.usgs.gov/ogcapi/v1", provider: "USGS" }),
  new FallbackService(),
  new ExplanationStore(),
);