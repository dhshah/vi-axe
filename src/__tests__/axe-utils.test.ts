import { configureAxe } from "../axe-utils.js";

describe("configureAxe", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a function", () => {
    const axe = configureAxe();
    expect(axe).toBeTypeOf("function");
  });

  it("returned function runs axe on HTML string and returns results", async () => {
    const axe = configureAxe();
    const html = `
      <main>
        <a href="https://example.com">Example</a>
      </main>
    `;
    const results = await axe(html);
    expect(results).toHaveProperty("violations");
    expect(Array.isArray(results.violations)).toBe(true);
    expect(results.violations).toHaveLength(0);
  });

  it("restores document.body after running axe with HTML string", async () => {
    const axe = configureAxe();
    const originalContent = '<div id="original">original</div>';
    document.body.innerHTML = originalContent;

    await axe('<div id="temp">temp</div>');

    expect(document.body.innerHTML).toBe(originalContent);
  });

  it("uses element as-is when it is already in the document", async () => {
    const axe = configureAxe();
    const el = document.createElement("main");
    el.innerHTML = '<a href="https://example.com">Link</a>';
    document.body.append(el);

    const results = await axe(el);

    expect(document.body.contains(el)).toBe(true);
    expect(results.violations).toHaveLength(0);
  });

  it("mounts element not in document by setting body innerHTML and restores", async () => {
    const axe = configureAxe();
    const el = document.createElement("main");
    el.innerHTML = '<a href="https://example.com">Link</a>';
    const originalContent = '<div id="original">original</div>';
    document.body.innerHTML = originalContent;

    const results = await axe(el);

    expect(results.violations).toHaveLength(0);
    expect(document.body.innerHTML).toBe(originalContent);
  });

  it("throws when given a non-HTML string", () => {
    const axe = configureAxe();
    expect(() => axe("Hello, World")).toThrow(
      'html parameter ("Hello, World") has no elements',
    );
  });

  it("throws when given invalid type (e.g. object)", () => {
    const axe = configureAxe();
    expect(() => {
      // @ts-expect-error - invalid test case
      axe({});
    }).toThrow("html parameter should be an HTML string or an HTML element");
  });

  it("applies globalOptions and disables color rules by default", async () => {
    const axe = configureAxe();
    const html = '<div style="color: red; background: red;">Low contrast</div>';
    const results = await axe(html);
    const colorViolations = results.violations.filter((v) =>
      ["color-contrast", "color-contrast-enhanced"].includes(v.id),
    );
    expect(colorViolations).toHaveLength(0);
  });

  it("returns link-name violations when link-name rule is enabled", async () => {
    const axe = configureAxe();
    const html = '<a href="#"></a>';
    const results = await axe(html);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toBe("link-name");
  });

  it("merges runner options from configureAxe with additionalOptions", async () => {
    const html = '<a href="#"></a>';
    const axe = configureAxe({
      rules: { "link-name": { enabled: false } },
    });

    const results = await axe(html);
    expect(results.violations).toHaveLength(0);

    const defaultAxe = configureAxe();
    const resultsWithViolations = await defaultAxe(html);
    expect(resultsWithViolations.violations.length).toBeGreaterThan(0);
  });

  it("additionalOptions override default runner options for a single run", async () => {
    const axe = configureAxe();
    const html = '<a href="#"></a>';

    const results = await axe(html, {
      rules: { "link-name": { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });

  it("accepts globalOptions with rules array for axe.configure", async () => {
    const axe = configureAxe({
      globalOptions: {
        rules: [{ id: "link-name", enabled: false }],
      },
    });
    const html = '<a href="#"></a>';
    const results = await axe(html);
    expect(results.violations).toHaveLength(0);
  });
});
