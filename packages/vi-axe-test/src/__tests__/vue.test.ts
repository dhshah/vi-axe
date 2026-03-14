import { mount } from "@vue/test-utils";
import { axe } from "vi-axe";

const ImageWithoutAlt = {
  data: () => ({ src: "#" }),
  template: '<img :src="src" />',
};

const AltImage = {
  props: ["alt"],
  template: '<main><img src="#" :alt="alt" /></main>',
};

const Card = {
  template: `<main><slot /></main>`,
};

describe("vi-axe with Vue", () => {
  it("detects image-alt violation via Vue Test Utils mount", async () => {
    const wrapper = mount(ImageWithoutAlt);

    const results = await axe(wrapper.element);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });

  it("passes when alt prop is provided to Vue component", async () => {
    const wrapper = mount(AltImage, { props: { alt: "descriptive text" } });

    const results = await axe(wrapper.element);
    expect(results).toHaveNoViolations();
  });

  it("passes when alt prop is empty string (decorative image pattern)", async () => {
    // Alt="" is valid — it marks the image as decorative, axe does not flag it
    const wrapper = mount(AltImage, { props: { alt: "" } });

    const results = await axe(wrapper.element);
    expect(results).toHaveNoViolations();
  });

  it("passes for a Vue component with accessible slotted content", async () => {
    const wrapper = mount(Card, {
      slots: { default: "<h2>Card title</h2><p>Content</p>" },
    });

    const results = await axe(wrapper.element);
    expect(results).toHaveNoViolations();
  });
});
