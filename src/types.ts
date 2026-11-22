/**
 * Type definitions for Switchly feature flag system.
 */

export type Environment = 'development' | 'staging' | 'production';

export interface FlagBase {
  key: string;
  enabled?: boolean; // default false
  defaultValue?: any;
}

export interface PercentageFlag extends FlagBase {
  rollout?: number; // 0-100
}

export interface TargetingRule {
  // Simple attribute matcher: attribute name -> allowed values or matcher function.
  attribute: string;
  value: any;
}

export interface TargetedFlag extends FlagBase {
  // List of user IDs that are explicitly enabled for the flag.
  userIds?: string[];
  // Optional attribute based rules.
  rules?: TargetingRule[];
}

export interface Variant {
  name: string;
  weight: number; // percentage weight, sum of all variants = 100
}

export interface ABTestFlag extends FlagBase {
  variants: Variant[];
}

export interface FlagConfig extends FlagBase {
  rollout?: number; // percentage rollout (0-100)
  userIds?: string[];
  rules?: TargetingRule[];
  variants?: Variant[];
  // Internal: environment specific config will be stored per env.
}

export interface SwitchlyOptions {
  environment?: Environment;
  initialConfig?: Record<string, FlagConfig>;
}

export interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, any>;
}
