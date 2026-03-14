import { axe, configureAxe } from "vi-axe";

describe("vi-axe integration (consuming built dist)", () => {
  it("axe returns results with a violations array", async () => {
    const html = `<title>Hello</title>`;
    const results = await axe(html);
    expect(results).toHaveProperty("violations");
    expect(Array.isArray(results.violations)).toBe(true);
  });

  it("toHaveNoViolations passes for accessible HTML", async () => {
    const html = `<title>Hello</title>`;
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it("axe detects link-name violations", async () => {
    const html = `<a href="#"></a>`;
    const results = await axe(html);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toEqual("link-name");
  });

  it("toHaveNoViolations throws when violations are found", async () => {
    const html = `<a href="#"></a>`;
    const results = await axe(html);
    expect(() => {
      expect(results).toHaveNoViolations();
    }).toThrow();
  });

  it("configureAxe with impactLevels filters violations by severity", async () => {
    // Link-name has "serious" impact, not "critical"
    // So toHaveNoViolations should filter it out when impactLevels is ["critical"]
    const customAxe = configureAxe({ impactLevels: ["critical"] });
    const html = `<a href="#"></a>`;
    const results = await customAxe(html);
    expect(results).toHaveNoViolations();
  });

  it("configureAxe returns a runner with the same Promise-based API", async () => {
    const customAxe = configureAxe();
    const html = `<title>Test page</title>`;
    const results = await customAxe(html);
    expect(results).toHaveNoViolations();
  });

  it("configureAxe with multiple impactLevels catches violations at those levels", async () => {
    // Link-name is "serious", image-alt is "critical" — both should surface
    const customAxe = configureAxe({ impactLevels: ["critical", "serious"] });
    const html = `<img src="#"><a href="#"></a>`;
    const results = await customAxe(html);
    expect(results.violations.length).toBeGreaterThan(0);
  });

  it("configureAxe with a disabled rule skips that rule", async () => {
    const customAxe = configureAxe({
      globalOptions: { rules: [{ id: "image-alt", enabled: false }] },
    });
    const html = `<img src="#">`;
    const results = await customAxe(html);
    expect(results.violations.every((v) => v.id !== "image-alt")).toBe(true);
  });

  it("configureAxe with runOnly limits which rules are evaluated", async () => {
    const customAxe = configureAxe({
      runOnly: { type: "rule", values: ["image-alt"] },
    });
    // Both image-alt and link-name would normally fire, but only image-alt runs
    const html = `<img src="#"><a href="#"></a>`;
    const results = await customAxe(html);
    expect(results.violations.every((v) => v.id === "image-alt")).toBe(true);
  });
});
