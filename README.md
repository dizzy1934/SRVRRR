# SF Bay Water Quality Explorer

A public web app that shows recent water-quality measurements from San Francisco Bay
monitoring stations, with plain-language explanations. Built by Team SRVRRR for CMPE 131.

Live alpha: https://srvrrr.vercel.app

This site is for education and exploration. It does not say whether water is safe for
drinking, swimming, or fishing.

## Run it locally

You need Node.js 20 or newer and Git.

```bash
git clone https://github.com/dizzy1934/SRVRRR.git
cd SRVRRR
npm install
npm run dev
```

Open http://localhost:3000. Click a station to load its latest measurements.

No API keys or environment variables are needed yet.

## Useful commands

- `npm run dev` starts the development server
- `npm run build` makes a production build (the same step Vercel runs)
- `npx tsc --noEmit` checks the TypeScript for errors

## How it works

1. The page (`src/app`) reads the station and search text from the address.
2. `StationService` finds stations in `src/lib/data/stations.json`.
3. `WaterQualityService` asks the USGS Water Data API for the station's latest readings
   through `ApiClient`, keeps the newest reading per parameter, and attaches the
   plain-language text from `src/lib/data/explanations.json`.
4. If USGS is slow or down, `FallbackService` returns a readable message instead of an error.

## Project layout

- `src/app` page and display components
- `src/lib/types.ts` shared types
- `src/lib/apiClient.ts` outbound requests with a 5-second timeout and typed errors
- `src/lib/usgsParser.ts` and `parameters.ts` turn USGS readings into measurements
- `src/lib/services` station, water-quality, and fallback services
- `src/lib/repositories` station and explanation lookups
- `src/lib/data` stations and explanation text

## Known limitations (alpha)

- Only one station is configured (SF Bay at the San Mateo Bridge).
- Dissolved oxygen and pH show "Not available" because this station has no current reading.
- Where a station has two sensors for one parameter, the app shows one of them.
- No wildlife panel, map, or caching yet.
- No automated tests yet.