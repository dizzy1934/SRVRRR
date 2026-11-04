import { StationRepository } from "./repositories/stationRepository";
import { StationService } from "./services/stationService";

export const stationService = new StationService(new StationRepository());