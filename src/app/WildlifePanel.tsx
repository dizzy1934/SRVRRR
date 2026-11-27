import { SpeciesObservation } from "../lib/types";

interface WildlifePanelProps {
  stationName: string;
  species: SpeciesObservation[];
  // Set when part of the data (such as conservation status) could not load.
  notice: string | null;
}

export function WildlifePanel({ stationName, species, notice }: WildlifePanelProps) {
  return (
    <section aria-labelledby="wildlife-heading" className="mt-10">
      <h2 id="wildlife-heading" className="text-xl font-semibold">
        Wildlife seen near {stationName}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Community sightings from iNaturalist within about 5 km. This is not a complete
        list of the animals that live here.
      </p>

      {notice && (
        <p
          role="status"
          className="mt-3 rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {notice}
        </p>
      )}

      {species.length === 0 ? (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          No recent sightings found near this station.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {species.map((s) => (
            <li
              key={s.taxonId}
              className="flex gap-3 rounded border border-zinc-300 p-4 dark:border-zinc-700"
            >
              {s.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt={s.commonName ?? s.scientificName}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold">{s.commonName ?? s.scientificName}</h3>
                <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                  {s.scientificName}
                </p>
                <p className="text-sm">{s.organismType}</p>
                <p className="mt-1 text-sm">
                  {s.status
                    ? `Conservation status: ${s.status.statusLabel} (${s.status.statusCode}, ${s.status.source})`
                    : "No conservation status on record. This does not mean the species is not at risk."}
                </p>
                <p className="mt-1 text-sm">
                  <a
                    href={`https://www.inaturalist.org/taxa/${s.taxonId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Source: iNaturalist
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
