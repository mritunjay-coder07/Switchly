# Switchly

**Switchly** is a lightweight, reusable feature‑flag management toolkit for Node.js applications. It lets you:

- Create flags with default values
- Enable/disable flags globally
- Perform deterministic percentage roll‑outs
- Target specific users or attribute‑based rules
- Run A/B tests with configurable variant distributions
- Keep separate configurations for `development`, `staging` and `production`
- Update flag configurations at runtime without restarting the application

The package is published under the scoped name **`@mritunjay07/switchly`** and supports both **CommonJS** and **ESM** consumers, with full TypeScript declaration files.

---

## Installation

```bash
npm install @mritunjay07/switchly
```

The package requires **Node ≥ 18**.

---

## Quick start

```ts
import { createSwitchly } from "@mritunjay07/switchly";

const switchly = createSwitchly({ environment: "development" });

// Register a simple boolean flag
switchly.registerFlag({ key: "dark-mode", enabled: true });

// Evaluate the flag for a user
const isDark = switchly.isEnabled("dark-mode", { userId: "user‑123" });
console.log("Dark mode enabled:", isDark);
```

---

## API reference

### `createSwitchly(options?: SwitchlyOptions): Switchly`
Creates a new Switchly instance.

### `Switchly` class methods
| Method | Description |
|--------|-------------|
| `registerFlag(flag: FlagConfig): void` | Adds a new flag to the current environment. Throws on duplicate keys or invalid configuration. |
| `updateFlag(key: string, updates: Partial<FlagConfig>): void` | Merges updates into an existing flag. |
| `isEnabled(key: string, ctx?: EvaluationContext): boolean` | Returns `true` if the flag is considered enabled for the provided context (user ID, attributes). |
| `evaluate(key: string, ctx?: EvaluationContext): any` | Returns the flag’s stored value (or the variant name for A/B flags). |
| `getVariant(key: string, ctx?: EvaluationContext): string \| null` | For A/B test flags, returns the selected variant name or `null` if not applicable. |
| `setEnvironment(env: Environment): void` | Switches the active environment (`development`, `staging`, `production`). |
| `getAllFlags(): Record<string, FlagConfig>` | Retrieves all flags for the current environment. |

### Types (re‑exported from `./types`)
```ts
export type Environment = "development" | "staging" | "production";

export interface SwitchlyOptions {
  environment?: Environment;
  initialConfig?: Record<string, FlagConfig>;
}

export interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, any>;
}

export interface FlagConfig {
  key: string;
  enabled?: boolean;          // defaults to false
  defaultValue?: any;
  rollout?: number;           // 0‑100 %
  userIds?: string[];        // whitelist
  rules?: TargetingRule[];    // attribute‑based rules
  variants?: Variant[];       // for A/B testing
}

export interface TargetingRule {
  attribute: string;
  value: any;
}

export interface Variant {
  name: string;
  weight: number; // relative weight, sum does not have to be 100
}
```

---

## Feature flag examples

### Simple flag
```ts
switchly.registerFlag({ key: "new‑ui", enabled: false });
// later
switchly.updateFlag("new‑ui", { enabled: true });
```

### Percentage rollout
```ts
switchly.registerFlag({ key: "beta‑feature", rollout: 25 });
const enabled = switchly.isEnabled("beta‑feature", { userId: "u‑42" });
```
The same `userId` will always get the same result because we hash `"beta-feature:u‑42"` deterministically.

### User targeting
```ts
switchly.registerFlag({
  key: "admin‑panel",
  enabled: false,
  userIds: ["admin‑001", "admin‑002"],
  rules: [{ attribute: "role", value: "admin" }]
});
```
If the user ID matches or the attribute rule matches, the flag is enabled regardless of the global `enabled` value.

### A/B testing
```ts
switchly.registerFlag({
  key: "homepage‑variant",
  variants: [
    { name: "control", weight: 70 },
    { name: "experiment", weight: 30 }
  ]
});
const variant = switchly.getVariant("homepage‑variant", { userId: "u‑99" });
```
Variant distribution follows the relative weights; the total does **not** need to equal `100`.

### Environment isolation
```ts
switchly.setEnvironment("staging");
switchly.registerFlag({ key: "staging‑only", enabled: true });
// The flag does not exist in "development" or "production".
```
Each environment maintains its own flag map.

---

## Evaluation precedence (what the engine actually does)
1. **Explicit disable** – if `flag.enabled === false` the flag is **always** `false`.
2. **User ID whitelist** – if `ctx.userId` is present and listed in `flag.userIds`, the flag is `true`.
3. **Attribute rules** – any rule that matches `ctx.attributes[rule.attribute] === rule.value` makes the flag `true`.
4. **Percentage rollout** – evaluated only when a `userId` is supplied; deterministic based on `key:userId`.
5. **Default enabled value** – if none of the above apply, the flag falls back to `flag.enabled ?? false`.

---

## Examples directory
The `examples/` folder contains runnable snippets:
- `basic.ts` – the quick‑start example above
- `ab-test.ts` – shows variant selection
- `env‑switch.ts` – demonstrates environment isolation

Run an example with:
```bash
npx ts-node examples/basic.ts
```
(You need `ts-node` installed globally or as a dev dependency.)

---

## Quality checks
- **Tests** – `npm test` runs the built‑in Node test runner against the compiled output.
- **Build** – `npm run build` compiles TypeScript to `dist/` (both ESM and CommonJS).
- **Declarations** – `dist/*.d.ts` are generated and verified by the TypeScript compiler.
- **Packaging** – `npm pack --dry-run` shows the files that would be published.
- **Import compatibility** – both `require('@mritunjay07/switchly')` (CommonJS) and `import … from '@mritunjay07/switchly'` (ESM) work.

---

## License
MIT © Mritunjay Sahu
