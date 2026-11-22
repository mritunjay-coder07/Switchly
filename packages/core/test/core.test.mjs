import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FeatureFlagManager } from '../dist/esm/index.js';

describe('FeatureFlagManager', () => {
  it('should register and check flag', () => {
    const mgr = new FeatureFlagManager();
    mgr.registerFlag('new-feature', true);
    assert.equal(mgr.isEnabled('new-feature'), true);
  });

  it('should update flag', () => {
    const mgr = new FeatureFlagManager();
    mgr.registerFlag('beta', false);
    assert.equal(mgr.isEnabled('beta'), false);
    mgr.updateFlag('beta', true);
    assert.equal(mgr.isEnabled('beta'), true);
  });

  it('should list flags', () => {
    const mgr = new FeatureFlagManager();
    mgr.registerFlag('a', true);
    mgr.registerFlag('b', false);
    const list = mgr.listFlags();
    assert.equal(list.length, 2);
    const keys = list.map(f => f.key).sort();
    assert.deepEqual(keys, ['a', 'b']);
  });
});
