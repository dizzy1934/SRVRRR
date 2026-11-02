import { Measurement } from "./types";
import { PARAMETERS } from "./parameters";

// The parts of a USGS reading that we actually use.
export interface UsgsFeature {
  properties: {
    monitoring_location_id: string;
    parameter_code: string;
    time: string;
    value: string | null;
    unit_of_measure: string;
  };
}

// How USGS writes a unit -> how we show it to a visitor.
const UNIT_LABELS: Record<string, string> = {
  degC: "°C",
  _FNU: "FNU",
  "mg/l": "mg/L",
};

function formatUnit(raw: string): string {
  return UNIT_LABELS[raw] ?? raw;
}

export function parseFeature(feature: UsgsFeature): Measurement | null {
  const props = feature.properties;

  // 1. If this isn't one of our four parameters, return null
  const info = PARAMETERS.find((p) => p.code === props.parameter_code);
  if (!info) return null;

  // 2. If there is no value (null, or empty text), return null
  if (props.value === null || props.value.trim() === "") return null;

  // 3. Convert the value from text to a number; if that fails, return null
  const value = Number(props.value);
  if (Number.isNaN(value)) return null;

  // 4. Build and return a Measurement
  return {
    stationId: props.monitoring_location_id,
    parameterCode: props.parameter_code,
    parameterName: info.name,
    value,
    unit: formatUnit(props.unit_of_measure),
    collectedAt: new Date(props.time),
    sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${props.monitoring_location_id}/`,
  };
}

export function pickLatest(measurements: Measurement[]): Measurement[] {
  // 1. Make an empty Map: parameter code -> the newest measurement seen so far
  const best = new Map<string, Measurement>();

  // 2. Go through the measurements one at a time:
  //    - if that parameter's drawer is empty, put this measurement in
  //    - if it already holds one, replace it only if this one is NEWER
  for (const m of measurements) {
    const current = best.get(m.parameterCode);
    if (current === undefined || m.collectedAt.getTime() > current.collectedAt.getTime()) {
      best.set(m.parameterCode, m);
    }
  }

  // 3. Return everything in the Map as a list
  return Array.from(best.values());
}