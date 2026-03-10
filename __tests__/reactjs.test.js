import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "../index.js";
import React from "react";
import ReactDOMServer from "react-dom/server";

expect.extend(toHaveNoViolations);

describe("React", () => {
  test("renders correctly", async () => {
    const element = React.createElement("img", { src: "#" });
    const html = ReactDOMServer.renderToString(element);

    const results = await axe(html);
    expect(() => {
      expect(results).toHaveNoViolations();
    }).toThrowErrorMatchingSnapshot();
  });

  test("renders a react testing library container correctly", async () => {
    const element = React.createElement("img", { src: "#" });
    const { container } = render(element);
    const results = await axe(container);

    expect(() => {
      expect(results).toHaveNoViolations();
    }).toThrowErrorMatchingSnapshot();
  });

  test("renders a react testing library container without duplicate ids", async () => {
    const element = React.createElement("img", {
      src: "#",
      alt: "test",
      id: "test",
    });
    const { container } = render(element);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
