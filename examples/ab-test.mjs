// examples/ab-test.mjs
// Demonstrates A/B testing with variant weights
import { createSwitchly } from "../dist/index.js";

const switchly = createSwitchly({ environment: "development" });

switchly.registerFlag({
  key: "homepage-variant",
  variants: [
    { name: "control", weight: 70 },
    { name: "experiment", weight: 30 }
  ]
});

const uid = "user-123";
const variant = switchly.getVariant("homepage-variant", { userId: uid });
console.log(`User ${uid} receives variant: ${variant}`);
