import { ApiFault, DataResult } from "../types";

// What each provider supplies, in plain words for the visitor.
const PROVIDER_LABELS: Record<string, string> = {
  USGS: "Water quality data",
  iNaturalist: "Wildlife data",
  NatureServe: "Conservation status data",
};

export class FallbackService {
  handle<T>(fault: ApiFault, emptyData: T): DataResult<T> {
    // 1. Log the failure
    this.logFailure(fault);

    // 2. Return a DataResult: empty data, isFallback true, a readable message
    return {
      data: emptyData,
      isFallback: true,
      retrievedAt: new Date(),
      message: this.messageFor(fault),
    };
  }

  logFailure(fault: ApiFault): void {
    // One line: time, provider, resource, kind, status. No stack trace.
    console.error(
      `[ERROR] ${new Date().toISOString()} provider=${fault.provider} resource=${fault.resource} kind=${fault.kind} status=${fault.httpStatus ?? "none"}`,
    );
  }

  private messageFor(fault: ApiFault): string {
    const what = PROVIDER_LABELS[fault.provider] ?? "Some data";
    if (fault.kind === "timeout") {
      return `${what} took too long to load. Please try again in a moment.`;
    }
    return `${what} is currently unavailable.`;
  }
}