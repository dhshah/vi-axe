import { axe } from "..";

describe("index", () => {
  it("should return link-name violations when link-name rule is enabled", async () => {
    const html = `<a href="#"></a>`;
    const results = await axe(html);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toEqual("link-name");
  });

  it("returns no violations when no violations are found", async () => {
    const html = `<a alt="test" id="test" src="#"></a>`;
    const results = await axe(html);
    expect(results.violations).toHaveLength(0);
  });

  it("toHaveNoViolations passes for accessible HTML", async () => {
    const html = `<title>Hello</title>`;
    expect(await axe(html)).toHaveNoViolations();
  });

  it("fails when violations are found", async () => {
    const html = `<a href="#"></a>`;
    const results = await axe(html);

    expect(() => {
      expect(results).toHaveNoViolations();
    }).toThrowErrorMatchingSnapshot();
  });
});
