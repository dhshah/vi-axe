/// <reference path="./types/global.d.ts" />
import axeCore from "axe-core";
import chalk from "chalk";
import { matcherHint, printReceived } from "jest-matcher-utils";
import merge from "lodash.merge";

type AxeResults = axeCore.AxeResults;
type Result = axeCore.Result;
type NodeResult = axeCore.NodeResult;
type RunOptions = axeCore.RunOptions;
type ImpactValue = axeCore.ImpactValue;

/** Minimal axe results shape accepted by the matcher (vi-axe allows toolOptions.impactLevels) */
interface AxeResultsLike {
  violations?: Result[];
  toolOptions?: RunOptions & { impactLevels?: ImpactValue[] };
}

/** Global options passed to axe.configure (vi-axe uses rules array) */
interface GlobalAxeOptions {
  rules?: Array<{ id: string; enabled: boolean }>;
  [key: string]: unknown;
}

/** Options for configureAxe: globalOptions plus runner options (impactLevels is vi-axe specific) */
interface ConfigureAxeOptions {
  globalOptions?: GlobalAxeOptions;
  impactLevels?: ImpactValue[];
}

type HtmlInput = Element | string;
type MountResult = [Element, () => void];

const AXE_RULES_COLOR = axeCore.getRules(["cat.color"]);

/**
 * Converts a HTML string or HTML element to a mounted HTML element.
 * @param html a HTML element or a HTML string
 * @returns a HTML element and a function to restore the document
 */
function mount(html: HtmlInput): MountResult {
  if (isHTMLElement(html)) {
    if (document.body.contains(html)) {
      return [html, () => {}];
    }

    html = html.outerHTML;
  }

  if (isHTMLString(html)) {
    const originalHTML = document.body.innerHTML;
    const restore = () => {
      document.body.innerHTML = originalHTML;
    };

    document.body.innerHTML = html;
    return [document.body, restore];
  }

  if (typeof html === "string") {
    throw new TypeError(`html parameter ("${html}") has no elements`);
  }

  throw new TypeError(
    "html parameter should be an HTML string or an HTML element",
  );
}

/**
 * Small wrapper for axe-core#run that enables promises (required for Jest),
 * default options and injects html to be tested
 * @param options default options to use in all instances
 * @returns returns instance of axe
 */
function configureAxe(options: ConfigureAxeOptions & RunOptions = {}) {
  const { globalOptions = {}, ...runnerOptions } = options;

  // Set the global configuration for axe-core
  // https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure
  const { rules = [], ...otherGlobalOptions } = globalOptions;

  // Color contrast checking doesnt work in a jsdom environment.
  // So we need to identify them and disable them by default.
  const defaultRules = AXE_RULES_COLOR.map(({ ruleId: id }) => ({
    enabled: false,
    id,
  }));

  axeCore.configure({
    rules: [...defaultRules, ...rules],
    ...otherGlobalOptions,
  });

  /**
   * Small wrapper for axe-core#run that enables promises (required for Jest),
   * default options and injects html to be tested
   * @param html a html string or element to be injected into the body
   * @param additionalOptions aXe options to merge with default options
   * @returns promise that will resolve with axe-core#run results object
   */
  return function axe(
    html: HtmlInput,
    additionalOptions: RunOptions = {},
  ): Promise<AxeResults> {
    const [element, restore] = mount(html);
    const runOptions = merge({}, runnerOptions, additionalOptions);

    return new Promise((resolve, reject) => {
      axeCore.run(element, runOptions, (err: Error | null, results: AxeResults) => {
        restore();
        if (err) {
          reject(err);
        }
        resolve(results);
      });
    });
  };
}

/**
 * Checks if the HTML parameter provided is a HTML element.
 * @param html a HTML element or a HTML string
 * @returns true or false
 */
function isHTMLElement(html: HtmlInput): html is Element {
  return (
    Boolean(html) &&
    typeof html === "object" &&
    typeof html.tagName === "string"
  );
}

/**
 * Checks that the HTML parameter provided is a string that contains HTML.
 * @param html a HTML element or a HTML string
 * @returns true or false
 */
function isHTMLString(html: HtmlInput): html is string {
  return typeof html === "string" && /(<([^>]+)>)/i.test(html);
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
        violation.impact !== undefined && violation.impact !== null && impactLevels.includes(violation.impact),
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

/**
 * Custom Jest expect matcher, that can check aXe results for violations.
 * @param results requires an instance of aXe's results object
 * @returns returns Jest matcher object
 */
const toHaveNoViolations = {
  toHaveNoViolations(results: AxeResultsLike): MatcherResult {
    if (results.violations === undefined) {
      throw new TypeError(
        "Unexpected aXe results object. No violations property found.\nDid you change the `reporter` in your aXe configuration?",
      );
    }

    const { toolOptions } = results;
    let impactLevels: ImpactValue[] = [];
    if (toolOptions && "impactLevels" in toolOptions && toolOptions.impactLevels) {
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
                helpUrlText = `You can find more information on this issue here: \n${chalk.blue(violation.helpUrl)}`;
              }
              return (
                expectedText +
                chalk.grey(node.html) +
                lineBreak +
                `Received:${lineBreak}` +
                printReceived(`${violation.help} (${violation.id})`) +
                lineBreak +
                chalk.yellow(node.failureSummary ?? "") +
                lineBreak +
                helpUrlText
              );
            })
            .join(lineBreak);

          return errorBody;
        })
        .join(lineBreak + horizontalLine + lineBreak);
    };

    const formatedViolations = reporter(filteredViolations);
    const pass = formatedViolations.length === 0; // Empty string = no violations

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
export const axe = configureAxe();
