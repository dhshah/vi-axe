import { styleText } from "node:util";

import { ImpactValue, NodeResult, Result, RunOptions } from "axe-core";
import { matcherHint, printReceived } from "jest-matcher-utils";

import { configureAxe } from "./axe-utils";

/** Minimal axe results shape accepted by the matcher (vi-axe allows toolOptions.impactLevels) */
interface AxeResultsLike {
  violations?: Result[];
  toolOptions?: RunOptions & { impactLevels?: ImpactValue[] };
}

/**
 * Filters all violations by user impact
 * @param violations result of the accessibilty check by axe
 * @param impactLevels defines which impact level should be considered (e.g ['critical'])
 * @returns violations filtered by impact level
 */
function filterViolations(
  violations: Result[],
  impactLevels: ImpactValue[] | undefined,
): Result[] {
  if (impactLevels && impactLevels.length > 0) {
    return violations.filter(
      (violation) =>
        violation.impact !== undefined &&
        violation.impact !== null &&
        impactLevels.includes(violation.impact),
    );
  }
  return violations;
}

/** Matcher result returned by toHaveNoViolations */
interface MatcherResult {
  actual: Result[];
  message: () => string | undefined;
  pass: boolean;
}

/** Vitest/Jest matcher object for toHaveNoViolations */
interface ToHaveNoViolationsMatcher {
  toHaveNoViolations(results: AxeResultsLike): MatcherResult;
}

/**
 * Custom Jest expect matcher, that can check aXe results for violations.
 * @param results requires an instance of aXe's results object
 * @returns returns Jest matcher object
 */
const toHaveNoViolations: ToHaveNoViolationsMatcher = {
  toHaveNoViolations(results: AxeResultsLike): MatcherResult {
    if (results.violations === undefined) {
      throw new TypeError(
        "Unexpected aXe results object. No violations property found.\nDid you change the `reporter` in your aXe configuration?",
      );
    }

    const { toolOptions } = results;
    let impactLevels: ImpactValue[] = [];
    if (
      toolOptions &&
      "impactLevels" in toolOptions &&
      toolOptions.impactLevels
    ) {
      ({ impactLevels } = toolOptions);
    }
    const filteredViolations = filterViolations(
      results.violations,
      impactLevels,
    );

    const reporter = (violationsToFormat: Result[]): string => {
      if (violationsToFormat.length === 0) {
        return "";
      }

      const lineBreak = "\n\n";
      const horizontalLine = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

      return violationsToFormat
        .map((violation: Result) => {
          const errorBody = violation.nodes
            .map((node: NodeResult) => {
              const selector = node.target.join(", ");
              const expectedText = `Expected the HTML found at $('${selector}') to have no violations:${lineBreak}`;
              let helpUrlText = "";
              if (violation.helpUrl) {
                helpUrlText = `You can find more information on this issue here: \n${styleText("blue", violation.helpUrl)}`;
              }
              return `${expectedText}${styleText("gray", node.html)}${lineBreak}Received:${lineBreak}${printReceived(`${violation.help} (${violation.id})`)}${lineBreak}${styleText("yellow", node.failureSummary ?? "")}${lineBreak}${helpUrlText}`;
            })
            .join(lineBreak);

          return errorBody;
        })
        .join(lineBreak + horizontalLine + lineBreak);
    };

    const formatedViolations = reporter(filteredViolations);
    // Empty string = no violations
    const pass = formatedViolations.length === 0;

    const message = () => {
      if (pass) {
        return;
      }
      return `${matcherHint(".toHaveNoViolations")}\n\n${formatedViolations}`;
    };

    return { actual: filteredViolations, message, pass };
  },
};

export type { AxeResultsLike };
export { configureAxe, toHaveNoViolations };
export const axe: ReturnType<typeof configureAxe> = configureAxe();
