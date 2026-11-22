/**
 * Simple deterministic hash function for rollout and variant assignment.
 * Uses SHA-256 and returns a number in [0, 1).
 */
import { createHash } from 'crypto';

/**
 * Returns a deterministic float between 0 (inclusive) and 1 (exclusive) for a given key.
 * The same key will always produce the same value.
 */
export function deterministicRatio(key: string): number {
  const hash = createHash('sha256').update(key).digest('hex');
  // Take first 8 hex characters (32 bits) and convert to a number.
  const prefix = hash.slice(0, 8);
  const intValue = parseInt(prefix, 16);
  return intValue / 0xffffffff; // 2^32 - 1
}
