/*

This allows users to add `import 'jest-axe/extend-expect'`
at the top of their test file rather than have two lines for this.

It also allows users to use jest's setupFiles configuration and
point directly to `jest-axe/extend-expect`

*/

import { toHaveNoViolations } from "./index.js";

interface AxeMatchers<TReturn = unknown> {
  toHaveNoViolations: () => TReturn;
}

declare module "vitest" {
  interface Matchers<T = unknown> extends AxeMatchers<T> {}
  interface Assertion<T = unknown> extends AxeMatchers<T> {}
}

expect.extend(toHaveNoViolations as Parameters<typeof expect.extend>[0]);
