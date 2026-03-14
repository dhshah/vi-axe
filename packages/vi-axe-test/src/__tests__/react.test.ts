import { render } from "@testing-library/react";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { axe } from "vi-axe";

describe("vi-axe with React", () => {
  it("detects image-alt violation from renderToString output", async () => {
    const element = React.createElement("img", { src: "#" });
    const html = ReactDOMServer.renderToString(element);

    const results = await axe(html);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });

  it("passes for an accessible React component via renderToString", async () => {
    const element = React.createElement(
      "main",
      null,
      React.createElement("img", { src: "#", alt: "A descriptive alt text" }),
    );
    const html = ReactDOMServer.renderToString(element);

    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });

  it("detects violations from a React Testing Library container", async () => {
    const element = React.createElement("img", { src: "#" });
    const { container } = render(element);

    const results = await axe(container);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });
});
