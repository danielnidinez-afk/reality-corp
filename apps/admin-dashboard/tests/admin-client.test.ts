import { describe, expect, it } from 'vitest';
import { ADMIN_DASHBOARD_STATUS } from '../src/index.js';

describe('apps/admin-dashboard minimal stub', () => {
  it('marks full admin dashboard UI explicitly for Phase 2 per DEC-13', () => {
    expect(ADMIN_DASHBOARD_STATUS).toBe('phase_2_minimal_stub');
  });
});

