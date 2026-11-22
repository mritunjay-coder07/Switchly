// src/index.ts
/**
 * Public entry point for Switchly.
 * Exports the factory function `createSwitchly`.
 */
import { Switchly } from "./core/switchly.js";
import type { SwitchlyOptions } from "./types.js";

/**
 * Factory that creates a Switchly instance with the given options.
 */
export function createSwitchly(options?: SwitchlyOptions): Switchly {
  return new Switchly(options);
}

export type { SwitchlyOptions, EvaluationContext, FlagConfig, Variant } from "./types.js";
