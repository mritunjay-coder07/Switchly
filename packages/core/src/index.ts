/**
 * Switchly - Feature Flag Management Toolkit
 *
 * Provides a simple in‑memory manager for boolean feature flags.
 */

export interface FeatureFlag {
  /** Unique key identifying the flag */
  key: string;
  /** Whether the flag is enabled */
  enabled: boolean;
}

/**
 * FeatureFlagManager allows registering, querying and updating feature flags.
 * It stores flags in a private Map for O(1) access.
 */
export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  /** Register a new flag. If the flag already exists it is overwritten. */
  registerFlag(key: string, enabled: boolean = false): void {
    this.flags.set(key, { key, enabled });
  }

  /** Return true if the flag exists and is enabled. */
  isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    return flag ? flag.enabled : false;
  }

  /** Retrieve the flag definition or undefined if not registered. */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /** Update an existing flag. If it does not exist, it is created. */
  updateFlag(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = enabled;
    } else {
      this.registerFlag(key, enabled);
    }
  }

  /** Remove a flag from the manager. */
  removeFlag(key: string): void {
    this.flags.delete(key);
  }

  /** List all registered flags. */
  listFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
}

export default FeatureFlagManager;
