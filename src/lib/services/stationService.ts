import { MonitoringStation } from "../types";
import { StationRepository } from "../repositories/stationRepository";

export class StationService {
  private readonly repo: StationRepository;

  constructor(repo: StationRepository) {
    this.repo = repo;
  }

  async listStations(): Promise<MonitoringStation[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<MonitoringStation | null> {
    return this.repo.findById(id);
  }

  async search(term: string): Promise<MonitoringStation[]> {
    const key = term.trim().toLowerCase();
    const all = await this.repo.findAll();
    return all.filter((station) => station.name.toLowerCase().includes(key));
  }
}