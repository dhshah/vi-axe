import "./types/global.d.ts";
import { ImpactValue, Result, RunOptions } from "axe-core";
import { configureAxe } from "./axe-utils";
/** Minimal axe results shape accepted by the matcher (vi-axe allows toolOptions.impactLevels) */
interface AxeResultsLike {
  violations?: Result[];
  toolOptions?: RunOptions & {
    impactLevels?: ImpactValue[];
  };
}
/** Matcher result returned by toHaveNoViolations */
interface MatcherResult {
  actual: Result[];
  message: () => string | undefined;
  pass: boolean;
}
/**
 * Custom Jest expect matcher, that can check aXe results for violations.
 * @param results requires an instance of aXe's results object
 * @returns returns Jest matcher object
 */
declare const toHaveNoViolations: {
  toHaveNoViolations(results: AxeResultsLike): MatcherResult;
};
export type { AxeResultsLike };
export { configureAxe, toHaveNoViolations };
export declare const axe: (
  html: string | Element,
  additionalOptions?: RunOptions,
) => Promise<import("axe-core").AxeResults>;
//# sourceMappingURL=index.d.ts.map
