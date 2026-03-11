# vi-axe

### A modern fork / rewrite of jest-axe for vitest.

I'm aware that vitest-axe also exists, however it seems to be unmaintained.

[![npm version](https://img.shields.io/npm/v/vi-axe.svg)](http://npm.im/vi-axe)
![node](https://img.shields.io/node/v/vi-axe)

Custom Vitest matcher for [aXe](https://github.com/dequelabs/axe-core) to test accessibility in your components and pages.

## Installation

```bash
pnpm add -D vi-axe
# or
npm install -D vi-axe
# or
yarn add -D vi-axe
```

## Setup

Configure Vitest so the `toHaveNoViolations` matcher is available in all tests. In your Vitest config (e.g. `vitest.config.ts`):

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // required for axe
    setupFiles: ["vi-axe/extend-expect"],
  },
});
```

Alternatively, in a single test file:

```ts
import "vi-axe/extend-expect";
```

## Usage

### Basic

Run axe on an HTML string or DOM element, then assert there are no violations:

```ts
import { axe } from "vi-axe";

test("has no a11y violations", async () => {
  const html = `<main><a href="https://example.com">Example</a></main>`;
  const results = await axe(html);
  expect(results).toHaveNoViolations();
});
```

### With React Testing Library

Pass the rendered container (or any element) to `axe`:

```ts
import { render } from "@testing-library/react";
import { axe } from "vi-axe";

test("component has no a11y violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### With Vue Test Utils

Pass the wrapper element:

```ts
import { mount } from "@vue/test-utils";
import { axe } from "vi-axe";

test("component has no a11y violations", async () => {
  const wrapper = mount(MyComponent);
  const results = await axe(wrapper.element);
  expect(results).toHaveNoViolations();
});
```

### Custom configuration

Use `configureAxe` to create an axe runner with default options. You can pass [axe-core run options](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md) and vi-axe-specific options:

```ts
import { configureAxe } from "vi-axe";

const axe = configureAxe({
  globalOptions: {
    rules: [{ id: "link-name", enabled: false }],
  },
});

test("custom axe run", async () => {
  const results = await axe("<a href='#'></a>");
  expect(results).toHaveNoViolations();
});
```

Per-run options can be passed as the second argument:

```ts
const results = await axe(html, {
  rules: { "link-name": { enabled: false } },
});
```

### Filtering by impact level

To fail only for certain impact levels (e.g. critical/serious), use `impactLevels` in `configureAxe`. The matcher will then consider only violations with those impacts:

```ts
import { configureAxe } from "vi-axe";

const axe = configureAxe({
  impactLevels: ["critical", "serious"],
});
```

## Requirements

- **Node**: >= 20
- **Vitest** with **jsdom** (or another DOM environment); axe needs a DOM to run.

Color contrast rules are disabled by default in vi-axe because they do not work reliably in jsdom.
