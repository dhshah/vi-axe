import { axe } from "vi-axe";

describe("vi-axe with jsdom DOM elements", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("detects image-alt violation on an img element without alt", async () => {
    const img = document.createElement("img");
    img.src = "#";
    document.body.append(img);

    const results = await axe(img);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });

  it("detects link-name violation on an anchor without text", async () => {
    const a = document.createElement("a");
    a.href = "#";
    document.body.append(a);

    const results = await axe(a);
    expect(results.violations.some((v) => v.id === "link-name")).toBe(true);
  });

  it("detects label violation on an unlabeled input", async () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.append(input);

    const results = await axe(input);
    expect(results.violations.some((v) => v.id === "label")).toBe(true);
  });

  it("passes for an input with an associated label", async () => {
    const div = document.createElement("div");
    div.innerHTML = `<label for="name">Name</label><input id="name" type="text" />`;
    document.body.append(div);

    const results = await axe(div);
    expect(results).toHaveNoViolations();
  });

  it("detects heading-order violation when a heading level is skipped", async () => {
    const div = document.createElement("div");
    // H1 → h3 skips h2, triggering heading-order
    div.innerHTML = `<h1>Title</h1><h3>Subsection</h3>`;
    document.body.append(div);

    const results = await axe(div);
    expect(results.violations.some((v) => v.id === "heading-order")).toBe(true);
  });

  it("passes for an icon button with aria-label", async () => {
    const button = document.createElement("button");
    button.setAttribute("aria-label", "Close dialog");
    button.innerHTML = `<svg aria-hidden="true"></svg>`;
    document.body.append(button);

    const results = await axe(button);
    expect(results).toHaveNoViolations();
  });

  it("works on a detached element not in document.body", async () => {
    const button = document.createElement("button");
    button.textContent = "Detached";
    // Not appended to document.body — vi-axe mounts it internally
    const results = await axe(button);
    expect(results).toHaveNoViolations();
  });
});
