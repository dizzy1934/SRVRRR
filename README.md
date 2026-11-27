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

No API keys or environment variables are needed to run it. (NatureServe's access terms are unconfirmed; see Known limitations.)

## Useful commands

- `npm run dev` starts the development server
- `npm run build` makes a production build (the same step Vercel runs)
- `npm test` runs the Jest unit tests (no live services are called)
- `npx tsc --noEmit` checks the TypeScript for errors

## How it works

1. The page (`src/app`) reads the station and search text from the address.
2. `StationService` finds stations in `src/lib/data/stations.json`.
3. `WaterQualityService` asks the USGS Water Data API for the station's latest readings
   through `ApiClient`, keeps the newest reading per parameter, and attaches the
   plain-language text from `src/lib/data/explanations.json`.
4. `SpeciesService` asks iNaturalist for species seen within 5 km of the station, then looks up
   each species' conservation rank in NatureServe. The wildlife panel has its own loading and
   error state, so a wildlife outage never hides the water cards.
5. If a provider is slow or down, `FallbackService` returns a readable message instead of an error.

## Project layout

- `src/app` page and display components
- `src/lib/types.ts` shared types
- `src/lib/apiClient.ts` outbound requests with a 5-second timeout and typed errors
- `src/lib/usgsParser.ts` and `parameters.ts` turn USGS readings into measurements
- `src/lib/wildlifeParser.ts` turns iNaturalist and NatureServe responses into species and status
- `src/lib/services` station, water-quality, and fallback services
- `src/lib/repositories` station and explanation lookups
- `src/lib/data` stations and explanation text

## Tests

`npm test` runs Jest tests for `ApiClient` (success, HTTP error, bad JSON, wrong shape,
network error, timeout), `StationService`, `WaterQualityService`, `SpeciesService`,
`FallbackService`, the USGS and wildlife parsers, `pickLatest`, and `ExplanationStore`.
Services are tested with a fake network, so no live API is called.

## Known limitations (beta)

- Only one station is configured (SF Bay at the San Mateo Bridge).
- Dissolved oxygen and pH show "Not available" because this station has no current reading.
- Where a station has two sensors for one parameter, the app shows one of them.
- Wildlife shows community sightings within 5 km, not a complete species list. Conservation
  status comes from NatureServe; if no record is found the card says so (this does not mean
  the species is not at risk).
- The iNaturalist and NatureServe response shapes were written from their public docs and
  have not yet been checked against live responses. Check the wildlife panel after deploy.
- No map or caching yet.
