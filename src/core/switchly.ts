// src/core/switchly.ts
/**
 * Core Switchly engine implementation.
 * Handles flag registration, evaluation, environment management and runtime updates.
 */
import { deterministicRatio } from "../utils/hash.js";
import type {
  EvaluationContext,
  FlagConfig,
  Environment,
  SwitchlyOptions,
  Variant,
} from "../types.js";

/**
 * Switchly class – the main public API object returned by `createSwitchly`.
 */
export class Switchly {
  /** Current environment */
  private environment: Environment = "development";

  /** Flag storage per environment */
  private envFlags: Record<Environment, Map<string, FlagConfig>> = {
    development: new Map(),
    staging: new Map(),
    production: new Map(),
  };

  constructor(options?: SwitchlyOptions) {
    if (options?.environment) {
      this.setEnvironment(options.environment);
    }
    if (options?.initialConfig) {
      for (const [key, cfg] of Object.entries(options.initialConfig)) {
        this.registerFlag(cfg);
      }
    }
  }

  /**
   * Set the active environment. Subsequent operations affect this environment.
   */
  public setEnvironment(env: Environment): void {
    if (!this.envFlags[env]) {
      throw new Error(`Unsupported environment "${env}"`);
    }
    this.environment = env;
  }

  /**
   * Register or replace a flag in the current environment.
   */
  public registerFlag(flag: FlagConfig): void {
    if (!flag.key) {
      throw new Error("Flag must have a non‑empty 'key' property");
    }
    const map = this.envFlags[this.environment];
    if (map.has(flag.key)) {
      throw new Error(`Flag "${flag.key}" already registered in environment "${this.environment}"`);
    }
    // Validate rollout percentage bounds
    if (flag.rollout !== undefined) {
      if (typeof flag.rollout !== 'number' || flag.rollout < 0 || flag.rollout > 100) {
        throw new Error(`Rollout percentage must be a number between 0 and 100 (got ${flag.rollout})`);
      }
    }
    // Validate variants
    if (flag.variants) {
      let totalWeight = 0;
      for (const v of flag.variants) {
        if (typeof v.weight !== 'number' || v.weight < 0) {
          throw new Error(`Variant weight must be a non‑negative number (variant ${v.name})`);
        }
        totalWeight += v.weight;
      }
      // No strict totalWeight requirement – zero weight results in no variant.
    }
    // Validate targeting rules
    if (flag.rules) {
      for (const r of flag.rules) {
        if (!r.attribute) {
          throw new Error('Targeting rule must have a non‑empty attribute name');
        }
      }
    }
    map.set(flag.key, { ...flag });
  }

  /** Retrieve a flag config (throws if not found). */
  private getFlag(key: string): FlagConfig {
    const map = this.envFlags[this.environment];
    const flag = map.get(key);
    if (!flag) {
      throw new Error(`Flag "${key}" not found in environment "${this.environment}"`);
    }
    return flag;
  }

  /** Update an existing flag configuration. */
  public updateFlag(key: string, updates: Partial<FlagConfig>): void {
    const flag = this.getFlag(key);
    const merged = { ...flag, ...updates } as FlagConfig;
    this.envFlags[this.environment].set(key, merged);
  }

  /** Return all flag configs for the current environment. */
  public getAllFlags(): Record<string, FlagConfig> {
    const out: Record<string, FlagConfig> = {};
    for (const [k, v] of this.envFlags[this.environment]) {
      out[k] = v;
    }
    return out;
  }

  /** Determine whether a flag is enabled for a given context. */
  public isEnabled(key: string, ctx: EvaluationContext = {}): boolean {
    const flag = this.getFlag(key);
    // If flag is explicitly disabled, short‑circuit.
    if (flag.enabled === false) return false;

    // Explicit user ID whitelist overrides other checks.
    if (ctx.userId && flag.userIds?.includes(ctx.userId)) return true;

    // Attribute‑based rules – any matching rule grants enable.
    if (flag.rules && ctx.attributes) {
      for (const rule of flag.rules) {
        if (ctx.attributes[rule.attribute] === rule.value) return true;
      }
    }

    // Percentage rollout – deterministic based on key + userId.
    if (typeof flag.rollout === "number" && ctx.userId) {
      const ratio = deterministicRatio(`${key}:${ctx.userId}`);
      if (ratio * 100 < flag.rollout) return true;
    }

    // If no special conditions, fall back to the flag's enabled flag (default true).
    return flag.enabled ?? false;
  }

  /** Evaluate a flag and return its stored value (if any) – for simple boolean flags this mirrors `isEnabled`. */
  public evaluate(key: string, ctx: EvaluationContext = {}): any {
    const flag = this.getFlag(key);
    if (flag.variants) {
      // For AB test flags we delegate to getVariant.
      return this.getVariant(key, ctx);
    }
    // For non‑variant flags return boolean enabled state.
    return this.isEnabled(key, ctx) ? flag.defaultValue ?? true : false;
  }

  /** Return the variant name selected for a user (or null if not applicable). */
  public getVariant(key: string, ctx: EvaluationContext = {}): string | null {
    const flag = this.getFlag(key);
    if (!flag.variants || flag.variants.length === 0) return null;
    if (!ctx.userId) return null;
    const totalWeight = flag.variants.reduce((s: number, v: Variant) => s + v.weight, 0);
    if (totalWeight === 0) return null;
    const ratio = deterministicRatio(`${key}:variant:${ctx.userId}`) * totalWeight;
    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (ratio < cumulative) return variant.name;
    }
    // Fallback – should not happen if weights sum to totalWeight.
    return flag.variants[flag.variants.length - 1].name;
  }
}
