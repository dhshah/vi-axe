import { axe, configureAxe, toHaveNoViolations } from "vi-axe";
import type { AxeResultsLike } from "vi-axe";

describe("vi-axe exported types", () => {
  it("axe accepts an HTML string", () => {
    expectTypeOf(axe).parameter(0).toEqualTypeOf<Element | string>();
  });

  it("axe returns a Promise", () => {
    expectTypeOf(axe).returns.toMatchTypeOf<Promise<unknown>>();
  });

  it("axe result has a violations array", () => {
    type AxeResult = Awaited<ReturnType<typeof axe>>;
    expectTypeOf<AxeResult>().toHaveProperty("violations");
  });

  it("configureAxe is a function", () => {
    expectTypeOf(configureAxe).toBeFunction();
  });

  it("configureAxe returns a runner that accepts HTML string or Element", () => {
    const runner = configureAxe();
    expectTypeOf(runner).parameter(0).toEqualTypeOf<Element | string>();
  });

  it("configureAxe runner returns a Promise", () => {
    const runner = configureAxe();
    expectTypeOf(runner).returns.toMatchTypeOf<Promise<unknown>>();
  });

  it("configureAxe runner result matches axe result shape", () => {
    type AxeResult = Awaited<ReturnType<typeof axe>>;
    type RunnerResult = Awaited<ReturnType<ReturnType<typeof configureAxe>>>;
    expectTypeOf<RunnerResult>().toEqualTypeOf<AxeResult>();
  });

  it("AxeResultsLike violations is optional", () => {
    const withoutViolations: AxeResultsLike = {};
    const withViolations: AxeResultsLike = { violations: [] };
    expect(withoutViolations).toBeDefined();
    expect(withViolations).toBeDefined();
  });

  it("toHaveNoViolations has the correct shape", () => {
    expectTypeOf(toHaveNoViolations).toHaveProperty("toHaveNoViolations");
    expectTypeOf(toHaveNoViolations.toHaveNoViolations).toBeFunction();
  });

  it("expect(results).toHaveNoViolations() is typed via extend-expect", async () => {
    const html = `<title>Hello</title>`;
    const results = await axe(html);
    // TypeScript should accept this call without errors
    expect(results).toHaveNoViolations();
  });
});
