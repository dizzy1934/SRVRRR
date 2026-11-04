import Link from "next/link";
import { MonitoringStation } from "../lib/types";

interface StationListProps {
  stations: MonitoringStation[];
  query: string;
  selectedId: string | null;
}

export function StationList({ stations, query, selectedId }: StationListProps) {
  return (
    <section aria-labelledby="stations-heading" className="mt-8">
      <h2 id="stations-heading" className="text-xl font-semibold">
        Monitoring stations
      </h2>

      <form method="get" className="mt-3 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search stations by name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search stations"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {selectedId && <input type="hidden" name="station" value={selectedId} />}
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>

      {stations.length === 0 ? (
        <p className="mt-4">No stations match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {stations.map((station) => (
            <li key={station.stationId}>
              <Link
                href={`/?station=${encodeURIComponent(station.stationId)}&q=${encodeURIComponent(query)}`}
                aria-current={station.stationId === selectedId ? "true" : undefined}
                                className={`block rounded border px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  station.stationId === selectedId
                    ? "border-zinc-900 bg-zinc-100 font-semibold dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {station.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}