import { MonitoringStation } from "../types";
import stationData from "../data/stations.json";

const stations: MonitoringStation[] = stationData;

export class StationRepository {
  async findAll(): Promise<MonitoringStation[]> {
    return [...stations];
  } // closes findAll

  async findById(id: string): Promise<MonitoringStation | null> {
    return stations.find((station) => station.stationId === id) ?? null;
  } // closes findById
} // closes the class