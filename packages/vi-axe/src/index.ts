import { styleText } from "node:util";

import { ImpactValue, NodeResult, Result, RunOptions } from "axe-core";

import { configureAxe } from "./axe-utils";

function matcherHint(name: string): string {
  return `expect(received).${name.replace(/^\./, "")}(expected)`;
}

function printReceived(value: string): string {
  return `"${value}"`;
}

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

const LINE_BREAK = "\n\n";
const HORIZONTAL_LINE = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

function reporter(violationsToFormat: Result[]): string {
  return violationsToFormat
    .map((violation: Result) =>
      violation.nodes
        .map((node: NodeResult) => {
          const selector = node.target.join(", ");
          const expectedText = `Expected the HTML found at $('${selector}') to have no violations:${LINE_BREAK}`;
          const helpUrlText = violation.helpUrl
            ? `You can find more information on this issue here: \n${styleText("blue", violation.helpUrl)}`
            : "";
          return `${expectedText}${styleText("gray", node.html)}${LINE_BREAK}Received:${LINE_BREAK}${printReceived(`${violation.help} (${violation.id})`)}${LINE_BREAK}${styleText("yellow", node.failureSummary ?? "")}${LINE_BREAK}${helpUrlText}`;
        })
        .join(LINE_BREAK),
    )
    .join(LINE_BREAK + HORIZONTAL_LINE + LINE_BREAK);
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

    const impactLevels = results.toolOptions?.impactLevels;
    const filteredViolations = filterViolations(
      results.violations,
      impactLevels,
    );

    const pass = filteredViolations.length === 0;
    const message = () => {
      if (pass) {
        return;
      }
      return `${matcherHint(".toHaveNoViolations")}\n\n${reporter(filteredViolations)}`;
    };

    return { actual: filteredViolations, message, pass };
  },
};

export type { AxeResultsLike };
export { configureAxe, toHaveNoViolations };
export const axe: ReturnType<typeof configureAxe> = configureAxe();
