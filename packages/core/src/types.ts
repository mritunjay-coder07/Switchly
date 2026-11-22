// Types for Switchly core

/** Reason codes for flag evaluation */
export enum EvaluationReason {
  /** Flag has a static enabled value */
  STATIC_ENABLED = "STATIC_ENABLED",
  /** Flag has a static disabled value */
  STATIC_DISABLED = "STATIC_DISABLED",
  /** User matched a targeting rule */
  TARGET_MATCH = "TARGET_MATCH",
  /** Result came from percentage rollout */
  PERCENTAGE_ROLLOUT = "PERCENTAGE_ROLLOUT",
  /** Fall back to default (disabled) */
  DEFAULT_VALUE = "DEFAULT_VALUE",
  /** Flag key not found */
  FLAG_NOT_FOUND = "FLAG_NOT_FOUND",
}

/** Targeting rule definition */
export interface TargetRule {
  /** Exact user ID match */
  userId?: string;
  /** Exact attribute match map */
  attributes?: Record<string, string | number | boolean>;
}

/** Feature flag configuration */
export interface FeatureFlagConfig {
  /** Unique key */
  key: string;
  /** Static enabled value – if defined, overrides rollout */
  enabled?: boolean;
  /** Percentage rollout (0‑100) – ignored if `enabled` is defined */
  rolloutPercentage?: number;
  /** Targeting rules – any match forces enabled */
  targets?: TargetRule[];
}

/** Evaluation result returned to callers */
export interface EvaluationResult {
  /** Flag key evaluated */
  flagKey: string;
  /** Whether the flag is considered enabled for the given context */
  enabled: boolean;
  /** Reason code explaining the decision */
  reason: EvaluationReason;
  /** Environment used for lookup */
  environment: string;
}

/** Context passed to evaluation */
export interface EvaluationContext {
  /** Identifier of the user */
  userId: string;
  /** Optional attribute map */
  attributes?: Record<string, string | number | boolean>;
  /** Environment name (e.g., "development", "production") */
  environment: string;
}
