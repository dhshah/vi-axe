/*

This allows users to add `import 'jest-axe/extend-expect'`
at the top of their test file rather than have two lines for this.

It also allows users to use jest's setupFiles configuration and
point directly to `jest-axe/extend-expect`

*/

import { toHaveNoViolations } from "./index.js";

declare module "vitest" {
  interface Assertion<TReturnType = unknown> {
    toHaveNoViolations(): TReturnType;
  }
}

expect.extend(toHaveNoViolations);
