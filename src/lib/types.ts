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

export interface ApiFaultDetails {
    provider: string;
    resource: string;
    kind: FaultKind;
    httpStatus?: number;
}

export class ApiFault extends Error {
    readonly provider: string;
    readonly resource: string;
    readonly kind: FaultKind;
    readonly httpStatus?: number;

    constructor(details: ApiFaultDetails) {
        super('${details.provider} ${details.kind} fault on ${details.resource}');
        this.name = "ApiFault";
        this.provider = details.provider;
        this.resource = details.resource;
        this.kind = details.kind;
        this.httpStatus = details.httpStatus;
    }
}

export interface DataResult<T> {
    data: T;
    isFallback: boolean;
    retrievedAt: Date;
    message: string | null;
}


