import { axe, toHaveNoViolations } from "..";

expect.extend(toHaveNoViolations);

describe("index", () => {
  it("should return link-name violations when link-name rule is enabled", async () => {
    const html = `
    <html lang="en">
        <head>
            <title>Hello</title>
        </head>
        <body>
            <a href="#"></a>
        </body>
    </html>`;
    const results = await axe(html);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toEqual("link-name");
  });

  it("returns no violations when no violations are found", async () => {
    const html = `
    <html lang="en">
        <head>
            <title>Hello</title>
        </head>
        <body>
            <a alt="test" id="test" src="#"></a>
        </body>
    </html>`;
    const results = await axe(html);
    expect(results.violations).toHaveLength(0);
  });

  it("returns no violations when no violations are found", async () => {
    const html = `
    <html lang="en">
        <head>
            <title>Hello</title>
        </head>
    </html>`;
    expect(await axe(html)).toHaveNoViolations();
  });

  test("fails when violations are found", async () => {
    const html = `
    <html lang="en">
        <head>
            <title>Hello</title>
        </head>
        <body>
            <a href="#"></a>
        </body>
    </html>`;
    const results = await axe(html);

    expect(() => {
      expect(results).toHaveNoViolations();
    }).toThrowErrorMatchingSnapshot();
  });
});
