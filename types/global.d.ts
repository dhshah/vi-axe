interface ViAxeMatchers<R = unknown> {
  toHaveNoViolations: () => R
}

declare module 'vitest' {
  interface Matchers<T = any> extends ViAxeMatchers<T> {}
}