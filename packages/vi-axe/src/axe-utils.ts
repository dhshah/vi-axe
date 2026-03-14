import axeCore, { AxeResults, ImpactValue, RunOptions } from "axe-core";
import merge from "lodash.merge";

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

// Precomputed once — AXE_RULES_COLOR never changes after module load
const DEFAULT_RULES = AXE_RULES_COLOR.map(({ ruleId: id }) => ({
  enabled: false,
  id,
}));

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
export function configureAxe(options: ConfigureAxeOptions & RunOptions = {}) {
  const { globalOptions = {}, ...runnerOptions } = options;

  // Set the global configuration for axe-core
  // https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure
  const { rules = [], ...otherGlobalOptions } = globalOptions;

  // Color contrast checking doesnt work in a jsdom environment.
  // So we need to identify them and disable them by default.
  axeCore.configure({
    rules: [...DEFAULT_RULES, ...rules],
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
      axeCore.run(
        element,
        runOptions,
        (err: Error | null, results: AxeResults) => {
          restore();
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        },
      );
    });
  };
}
