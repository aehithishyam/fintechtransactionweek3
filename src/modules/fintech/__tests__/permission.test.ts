// Access control workflow
import { describe, test, expect } from 'vitest';
import { ROLE_PERMISSIONS } from '../constants';

describe('Role permissions', () => {
    test('support agent cannot approve disputes', () => {
        expect(ROLE_PERMISSIONS.support_agent).not.toContain('approve_dispute');
    });

    test('risk analyst can approve disputes', () => {
        expect(ROLE_PERMISSIONS.risk_analyst).toContain('approve_dispute');
    });

    test('finance ops can settle disputes', () => {
        expect(ROLE_PERMISSIONS.finance_ops).toContain('settle_dispute');
    });
});