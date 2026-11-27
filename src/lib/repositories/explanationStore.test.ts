import { ExplanationStore } from "./explanationStore";
import { PARAMETERS } from "../parameters";

describe("ExplanationStore", () => {
  const store = new ExplanationStore();

  it("has a non-empty explanation for every parameter we show", async () => {
    for (const p of PARAMETERS) {
      const e = await store.findByCode(p.code);
      expect(e).not.toBeNull();
      expect(e?.plainLanguage.trim()).not.toBe("");
      expect(e?.ecologicalEffect.trim()).not.toBe("");
    }
  });

  it("returns null for an unknown code", async () => {
    expect(await store.findByCode("99999")).toBeNull();
  });
});
