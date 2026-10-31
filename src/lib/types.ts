export interface MonitoringStation {
    stationId: string;
    name: string;
    latitude: number;
    longitude: number;
    dataSource: string;
}

export interface MetricExplanation {
    parameterCode: string;
    title: string;
    plainLanguage: string;
    ecologicalEffect: string;
}

export interface Measurement {
    parameterCode: string;
    parameterName: string;
    value: number;
    unit: string;
    collectedAt: Date;
    sourceUrl: string;
    explanation?: MetricExplanation;
}

export interface SpeciesObservation {
    taxonId: number;
    commonName: string | null;
    scientificName: string;
    organismType: string;
    imageUrl: string | null;
    status: ConservationStatus | null;
}

export interface ConservationStatus {
    taxonId: number;
    statusCode: string;
    statusLabel: string;
    source: string;
}

export type FaultKind = "timeout" | "http" | "network" | "malformed";

export interface ApiFault {
    provider: string;
    resource: string;
    kind: FaultKind;
    httpsStatus?: number;
}

export interface DataResult<T> {
    data: T;
    isFallback: boolean;
    retrievedAt: Date;
    message: string | null;
}


