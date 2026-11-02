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
    unit: props.unit_of_measure,
    collectedAt: new Date(props.time),
    sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${props.monitoring_location_id}/`,
  };
}