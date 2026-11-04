import { PARAMETERS } from "../lib/parameters";
import { Measurement } from "../lib/types";

interface MeasurementCardsProps {
  stationName: string;
  measurements: Measurement[];
}

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}

export function MeasurementCards({ stationName, measurements }: MeasurementCardsProps) {
  return (
    <section aria-labelledby="readings-heading" className="mt-8">
      <h2 id="readings-heading" className="text-xl font-semibold">
        Latest measurements: {stationName}
      </h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {PARAMETERS.map((parameter) => {
          const measurement = measurements.find((m) => m.parameterCode === parameter.code);
          return (
            <li
              key={parameter.code}
              className="rounded border border-zinc-300 p-4 dark:border-zinc-700"
            >
              <h3 className="font-semibold">{parameter.name}</h3>
              {measurement ? (
                <>
                  <p className="mt-1 text-2xl">
                    {measurement.value} {measurement.unit}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Measured {formatTime(measurement.collectedAt)}
                  </p>
                  {measurement.explanation && (
                    <p className="mt-2 text-sm">
                      {measurement.explanation.plainLanguage}{" "}
                      {measurement.explanation.ecologicalEffect}
                    </p>
                  )}
                  <p className="mt-2 text-sm">
                    <a
                      href={measurement.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Source: USGS station page
                    </a>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  Not available. This station has no current reading for this measurement.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}