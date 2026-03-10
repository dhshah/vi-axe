import axeCore from "axe-core";
import chalk from "chalk";
import { matcherHint, printReceived } from "jest-matcher-utils";
import merge from "lodash.merge";

const AXE_RULES_COLOR = axeCore.getRules(["cat.color"]);

/**
 * Converts a HTML string or HTML element to a mounted HTML element.
 * @param {Element | string} a HTML element or a HTML string
 * @returns {[Element, function]} a HTML element and a function to restore the document
 */
function mount(html) {
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
 * @param {object} [options] default options to use in all instances
 * @param {object} [options.globalOptions] Global axe-core configuration (See https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure)
 * @param {object} [options.*] Any other property will be passed as the runner configuration (See https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter)
 * @returns {function} returns instance of axe
 */
function configureAxe(options = {}) {
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
   * @param {string} html requires a html string to be injected into the body
   * @param {object} [additionalOptions] aXe options to merge with default options
   * @returns {promise} returns promise that will resolve with axe-core#run results object
   */
  return function axe(html, additionalOptions = {}) {
    const [element, restore] = mount(html);
    const runOptions = merge({}, runnerOptions, additionalOptions);

    return new Promise((resolve, reject) => {
      axeCore.run(element, runOptions, (err, results) => {
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
 * @param {Element} a HTML element or a HTML string
 * @returns {boolean} true or false
 */
function isHTMLElement(html) {
  return (
    Boolean(html) &&
    typeof html === "object" &&
    typeof html.tagName === "string"
  );
}

/**
 * Checks that the HTML parameter provided is a string that contains HTML.
 * @param {string} a HTML element or a HTML string
 * @returns {boolean} true or false
 */
function isHTMLString(html) {
  return typeof html === "string" && /(<([^>]+)>)/i.test(html);
}

/**
 * Filters all violations by user impact
 * @param {object} violations result of the accessibilty check by axe
 * @param {array} impactLevels defines which impact level should be considered (e.g ['critical'])
 * The level of impact can be "minor", "moderate", "serious", or "critical".
 * @returns {object} violations filtered by impact level
 */
function filterViolations(violations, impactLevels) {
  if (impactLevels && impactLevels.length > 0) {
    return violations.filter((v) => impactLevels.includes(v.impact));
  }
  return violations;
}

/**
 * Custom Jest expect matcher, that can check aXe results for violations.
 * @param {object} object requires an instance of aXe's results object
 * (https://github.com/dequelabs/axe-core/blob/develop-2x/doc/API.md#results-object)
 * @returns {object} returns Jest matcher object
 */
const toHaveNoViolations = {
  toHaveNoViolations(results) {
    if (results.violations === void 0) {
      throw new TypeError(
        "Unexpected aXe results object. No violations property found.\nDid you change the `reporter` in your aXe configuration?",
      );
    }

    const { toolOptions } = results;
    let impactLevels = [];
    if (toolOptions && toolOptions.impactLevels) {
      ({ impactLevels } = toolOptions);
    }
    const filteredViolations = filterViolations(
      results.violations,
      impactLevels,
    );

    const reporter = (violationsToFormat) => {
      if (violationsToFormat.length === 0) {
        return [];
      }

      const lineBreak = "\n\n";
      const horizontalLine = "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";

      return violationsToFormat
        .map((violation) => {
          const errorBody = violation.nodes
            .map((node) => {
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
                chalk.yellow(node.failureSummary) +
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

export { configureAxe, toHaveNoViolations };
export const axe = configureAxe();
