import { ApiClient } from "../apiClient";
import { DataResult, Measurement } from "../types";
import { UsgsFeature, parseFeature, pickLatest } from "../usgsParser";

// The part of the USGS response we use: the list of readings.
interface UsgsResponse {
  features: UsgsFeature[];
}

export class WaterQualityService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getMeasurements(stationId: string): Promise<DataResult<Measurement[]>> {
    // 1. Ask USGS for the station's latest readings
    const response = await this.client.get<UsgsResponse>("collections/latest-continuous/items", {
      f: "json",
      monitoring_location_id: stationId,
      limit: 100,
    });

    // 2. Turn each reading into a Measurement, dropping the unusable ones
    const parsed: Measurement[] = [];
    for (const feature of response.features) {
      const measurement = parseFeature(feature);
      if (measurement !== null) {
        parsed.push(measurement);
      }
    }

    // 3. Keep the newest reading per parameter
    const latest = pickLatest(parsed);

    // 4. Wrap the result and return it
    return { data: latest, isFallback: false, retrievedAt: new Date(), message: null };
  }
}