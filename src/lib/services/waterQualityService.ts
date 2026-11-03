import { ApiClient } from "../apiClient";
import { ExplanationStore } from "../repositories/explanationStore";
import { ApiFault, DataResult, Measurement } from "../types";
import { UsgsFeature, parseFeature, pickLatest } from "../usgsParser";
import { FallbackService } from "./fallbackService";

// The part of the USGS response we use: the list of readings.
interface UsgsResponse {
  features: UsgsFeature[];
}

export class WaterQualityService {
  private readonly client: ApiClient;
  private readonly fallback: FallbackService;
  private readonly explanations: ExplanationStore;

  constructor(client: ApiClient, fallback: FallbackService, explanations: ExplanationStore) {
    this.client = client;
    this.fallback = fallback;
    this.explanations = explanations;
  }

  async getMeasurements(stationId: string): Promise<DataResult<Measurement[]>> {
    try {
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

      // 4. Attach a plain-language explanation to each measurement
      const translated: Measurement[] = [];
      for (const measurement of latest) {
        translated.push(await this.translate(measurement));
      }

      // 5. Wrap the result and return it
      return { data: translated, isFallback: false, retrievedAt: new Date(), message: null };
    } catch (err) {
      // 6. A known failure becomes a friendly fallback result
      if (err instanceof ApiFault) {
        return this.fallback.handle<Measurement[]>(err, []);
      }
      // Anything else is a bug in our code; don't hide it
      throw err;
    }
  }

  // Pairs a measurement with its explanation, if one exists.
  private async translate(measurement: Measurement): Promise<Measurement> {
    const explanation = await this.explanations.findByCode(measurement.parameterCode);
    if (explanation === null) {
      return measurement;
    }
    return { ...measurement, explanation };
  }
}