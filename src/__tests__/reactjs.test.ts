import { render } from "@testing-library/react";
import React from "react";
import ReactDOMServer from "react-dom/server";

import { axe, toHaveNoViolations } from "../index";

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
      alt: "test",
      id: "test",
      src: "#",
    });
    const { container } = render(element);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
