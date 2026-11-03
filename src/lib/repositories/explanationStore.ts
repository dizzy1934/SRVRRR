import { MetricExplanation } from "../types";
import explanationData from "../data/explanations.json";

const explanations: MetricExplanation[] = explanationData;

export class ExplanationStore {
  async findByCode(code: string): Promise<MetricExplanation | null> {
    return explanations.find((e) => e.parameterCode === code) ?? null;
  }
}