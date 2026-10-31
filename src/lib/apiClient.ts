export interface ApiClientOptions {
    baseUrl: string;
    provider: string;
    timeoutMs?: number;
}

export class ApiClient {
    private readonly baseUrl: string;
    private readonly provider: string;
    private readonly timeoutMs: number;

    constructor(options: ApiClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, "");
        this.provider = options.provider;
        this.timeoutMs = options.timeoutMs ?? 5000;
    }
}

