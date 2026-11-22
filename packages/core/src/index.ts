// Switchly - Feature Flag Management Toolkit
// Provides a full‑feature in‑memory manager supporting:
//   • Boolean & percentage rollouts
//   • Targeting rules (userId / attributes)
//   • Environment‑scoped configurations
//   • Deterministic hashing (FNV‑a) for rollouts
//   • Structured evaluation results with reason codes

import { EvaluationResult, EvaluationContext, FeatureFlagConfig, EvaluationReason, TargetRule } from "./types.js";
/** In‑memory manager for feature flags. */
export class FeatureFlagManager {
  /** env → flagKey → config */
  private store: Map<string, Map<string, FeatureFlagConfig>> = new Map();

  /** Register a flag using a simple key/boolean signature or full config. */
  registerFlag(
    keyOrConfig: string | FeatureFlagConfig,
    enabledOrEnv?: boolean | string,
    envOrOverwrite?: string | boolean,
    maybeOverwrite?: boolean,
  ): void {
    let config: FeatureFlagConfig;
    let env = "development";
    let overwrite = false;

    if (typeof keyOrConfig === "string") {
      const key = keyOrConfig;
      const enabled = typeof enabledOrEnv === "boolean" ? enabledOrEnv : undefined;
      if (typeof enabledOrEnv === "string") env = enabledOrEnv;
      else if (typeof envOrOverwrite === "string") env = envOrOverwrite;
      if (typeof envOrOverwrite === "boolean") overwrite = envOrOverwrite;
      else if (typeof maybeOverwrite === "boolean") overwrite = maybeOverwrite;
      config = { key, ...(enabled !== undefined ? { enabled } : {}) } as FeatureFlagConfig;
    } else {
      config = keyOrConfig;
      if (typeof enabledOrEnv === "string") env = enabledOrEnv;
      if (typeof envOrOverwrite === "boolean") overwrite = envOrOverwrite;
    }

    this.validateConfig(config);
    const envMap = this.ensureEnv(env);
    if (envMap.has(config.key) && !overwrite) {
      throw new Error(`Flag "${config.key}" already exists in "${env}".`);
    }
    envMap.set(config.key, { ...config });
  }

  /** Retrieve a deep‑frozen copy of a flag configuration (or undefined). */
  getFlag(key: string, env: string = "development"): FeatureFlagConfig | undefined {
    const cfg = this.ensureEnv(env).get(key);
    return cfg ? Object.freeze({ ...cfg }) : undefined;
  }

  /** Convenience method to check if a flag is enabled (boolean only). */
  isEnabled(key: string, env: string = "development"): boolean {
    const cfg = this.getFlag(key, env);
    return cfg?.enabled === true;
  }

  /** Update an existing flag or create it if missing. */
  updateFlag(
    keyOrConfig: string | FeatureFlagConfig,
    enabledOrEnv?: boolean | string,
    envOrOverwrite?: string | boolean,
    maybeOverwrite?: boolean,
  ): void {
    let config: FeatureFlagConfig;
    let env = "development";
    let overwrite = true;

    if (typeof keyOrConfig === "string") {
      const key = keyOrConfig;
      const enabled = typeof enabledOrEnv === "boolean" ? enabledOrEnv : undefined;
      if (typeof enabledOrEnv === "string") env = enabledOrEnv;
      else if (typeof envOrOverwrite === "string") env = envOrOverwrite;
      if (typeof envOrOverwrite === "boolean") overwrite = envOrOverwrite;
      else if (typeof maybeOverwrite === "boolean") overwrite = maybeOverwrite;
      config = { key, ...(enabled !== undefined ? { enabled } : {}) } as FeatureFlagConfig;
    } else {
      config = keyOrConfig;
      if (typeof enabledOrEnv === "string") env = enabledOrEnv;
      if (typeof envOrOverwrite === "boolean") overwrite = envOrOverwrite;
    }

    this.validateConfig(config);
    const envMap = this.ensureEnv(env);
    if (!envMap.has(config.key) && !overwrite) {
      throw new Error(`Flag "${config.key}" does not exist in "${env}".`);
    }
    envMap.set(config.key, { ...config });
  }

  /** Remove a flag from the given environment. */
  removeFlag(key: string, env: string = "development"): void {
    this.ensureEnv(env).delete(key);
  }

  /** List all flag configurations for an environment. */
  listFlags(env: string = "development"): FeatureFlagConfig[] {
    return Array.from(this.ensureEnv(env).values());
  }

  /** Evaluate a flag for a specific user/context. */
  evaluate(key: string, context: EvaluationContext): EvaluationResult {
    const cfg = this.getFlag(key, context.environment);
    if (!cfg) {
      return {
        flagKey: key,
        enabled: false,
        reason: EvaluationReason.FLAG_NOT_FOUND,
        environment: context.environment,
      };
    }
    if (typeof cfg.enabled === "boolean") {
      return {
        flagKey: key,
        enabled: cfg.enabled,
        reason: cfg.enabled ? EvaluationReason.STATIC_ENABLED : EvaluationReason.STATIC_DISABLED,
        environment: context.environment,
      };
    }
    if (cfg.targets?.some((t) => this.matchesTarget(t, context))) {
      return {
        flagKey: key,
        enabled: true,
        reason: EvaluationReason.TARGET_MATCH,
        environment: context.environment,
      };
    }
    if (typeof cfg.rolloutPercentage === "number") {
      const hash = this.stableHash(`${cfg.key}:${context.userId}`);
      const bucket = (hash % 100) + 1; // 1‑100 inclusive
      const enabled = bucket <= cfg.rolloutPercentage;
      return {
        flagKey: key,
        enabled,
        reason: EvaluationReason.PERCENTAGE_ROLLOUT,
        environment: context.environment,
      };
    }
    return {
      flagKey: key,
      enabled: false,
      reason: EvaluationReason.DEFAULT_VALUE,
      environment: context.environment,
    };
  }

  // -----------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------
  private ensureEnv(env: string): Map<string, FeatureFlagConfig> {
    if (!this.store.has(env)) this.store.set(env, new Map());
    return this.store.get(env)!;
  }

  private matchesTarget(rule: TargetRule, ctx: EvaluationContext): boolean {
    if (rule.userId && rule.userId === ctx.userId) return true;
    if (rule.attributes && ctx.attributes) {
      return Object.entries(rule.attributes).every(([k, v]) => ctx.attributes?.[k] === v);
    }
    return false;
  }

  /** Simple deterministic FNV‑a hash – pure JS, zero dependencies. */
  private stableHash(str: string): number {
    let hash = 0x811c9dc5; // FNV offset basis
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0; // 32‑bit FNV prime
    }
    return hash;
  }

  private validateConfig(cfg: FeatureFlagConfig): void {
    if (!cfg.key || typeof cfg.key !== "string") {
      throw new Error("Flag key must be a non‑empty string.");
    }
    if (cfg.enabled !== undefined && typeof cfg.enabled !== "boolean") {
      throw new Error("`enabled` must be boolean if provided.");
    }
    if (
      cfg.rolloutPercentage !== undefined &&
      (typeof cfg.rolloutPercentage !== "number" || cfg.rolloutPercentage < 0 || cfg.rolloutPercentage > 100)
    ) {
      throw new Error("`rolloutPercentage` must be a number between 0 and 100.");
    }
    if (cfg.targets) {
      cfg.targets.forEach((t) => {
        if (t.userId && typeof t.userId !== "string") {
          throw new Error("Target `userId` must be a string.");
        }
        if (t.attributes && typeof t.attributes !== "object") {
          throw new Error("Target `attributes` must be an object.");
        }
      });
    }
  }
}

// Re‑export public types for consumers
export {
  EvaluationReason,
  EvaluationResult,
  EvaluationContext,
  FeatureFlagConfig,
  TargetRule,
};
