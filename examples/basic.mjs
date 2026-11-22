// examples/basic.mjs
// Simple ESM example showing registration and evaluation
import { createSwitchly } from "../dist/index.esm.js";

const switchly = createSwitchly({ environment: "development" });

switchly.registerFlag({ key: "demo-flag", enabled: true });
console.log("demo-flag enabled:", switchly.isEnabled("demo-flag"));
