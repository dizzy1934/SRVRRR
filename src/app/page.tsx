import { Suspense } from "react";
import { stationService, waterQualityService } from "../lib/appServices";
import { MeasurementCards } from "./MeasurementCards";
import { StationList } from "./StationList";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// An address like ?q=a&q=b gives a list. We keep the first value, and keep it short.
function first(value: string | string[] | undefined): string {
  const text = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  return text.slice(0, 100);
}

async function Stations({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = first(params.q);
  const selected = first(params.station);
  const stations = await stationService.search(query);
  return (
    <StationList
      stations={stations}
      query={query}
      selectedId={selected === "" ? null : selected}
    />
  );
}

async function Readings({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const stationId = first(params.station);

  if (stationId === "") {
    return <p className="mt-8 text-zinc-600 dark:text-zinc-400">Select a station to see its latest measurements.</p>;
  }

  const station = await stationService.getById(stationId);
  if (station === null) {
    return <p className="mt-8">We couldn&rsquo;t find that station. Please choose one from the list.</p>;
  }

  const result = await waterQualityService.getMeasurements(station.stationId);
  return <MeasurementCards stationName={station.name} measurements={result.data} />;
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">SF Bay Water Quality Explorer</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Explore recent water measurements from San Francisco Bay monitoring stations,
        with plain-language explanations.
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        This site is for education and exploration. It does not say whether water is
        safe for drinking, swimming, or fishing.
      </p>

      <Suspense fallback={<p className="mt-8">Loading stations&hellip;</p>}>
        <Stations searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<p className="mt-8">Loading measurements&hellip;</p>}>
        <Readings searchParams={searchParams} />
      </Suspense>
    </main>
  );
}