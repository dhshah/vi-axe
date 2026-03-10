interface AxeMatchers<TReturn = unknown> {
  toHaveNoViolations: () => TReturn;
}

declare module "vitest" {
  interface Matchers<TActual = unknown> extends AxeMatchers<TActual> {}
}
