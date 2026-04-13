import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

let configured = false;

function configure() {
  if (configured) return;
  zxcvbnOptions.setOptions({
    translations: zxcvbnEnPackage.translations,
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary,
    },
  });
  configured = true;
}

export type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Ultimate!";
  color: string;
};

const LABELS: StrengthResult["label"][] = [
  "Very weak",
  "Weak",
  "Fair",
  "Strong",
  "Ultimate!",
];

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-emerald-500",
  "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500",
];

export function passwordStrength(password: string): StrengthResult {
  configure();
  const result = zxcvbn(password);
  const score = result.score as 0 | 1 | 2 | 3 | 4;
  return {
    score,
    label: LABELS[score],
    color: COLORS[score],
  };
}
