export interface ParameterInfo {
    code: string;
    name: string;
}

export const PARAMETERS: ParameterInfo[] = [
    // one object per parameter
    { code: "00010", name: "Water temperature"},
    { code: "63680", name: "Turbidity"},
    { code: "00300", name: "Dissolved oxygen"},
    { code: "00400", name: "pH"},
];