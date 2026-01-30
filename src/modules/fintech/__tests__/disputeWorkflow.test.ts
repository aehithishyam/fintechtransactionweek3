// User workflow transitions
import { describe, test, expect } from 'vitest';
import { disputeService } from '../services/disputeService';
import type { DisputeFormData } from '../types';

const baseForm: DisputeFormData = {
    transactionId: 'TXN-001000',
    reason: 'fraudulent_activity',
    priority: 'high',
    description: 'Unauthorized transaction',
    requestedAmount: 100,
    evidence: [],
};

describe('Dispute workflow', () => {
    test('creates dispute with status created', async () => {
    const dispute = await disputeService.createDispute(baseForm, 'user-1');


    expect(dispute.status).toBe('created');
    expect(dispute.transactionId).toBe(baseForm.transactionId);
});

test('created → under_review → approved → settled', async () => {
    const dispute = await disputeService.createDispute(baseForm, 'user-1');


    const review = await disputeService.changeStatus(
        dispute.id,
        'under_review',
        'agent-1',
        undefined,
        undefined,
        dispute.version
    );
    
    expect(review.dispute.status).toBe('under_review');
    const approved = await disputeService.changeStatus(
        dispute.id,
        'approved',
        'risk-1',
        'Valid claim',
        100,
        review.dispute.version
    );


    expect(approved.dispute.status).toBe('approved');

    const settled = await disputeService.changeStatus(
        dispute.id,
        'settled',
        'finance-1',
        'Refund processed',
        undefined,
        approved.dispute.version
    );
        expect(settled.dispute.status).toBe('settled');
    },15000);

    test('created → under_review → rejected', async () => {
    const dispute = await disputeService.createDispute(baseForm, 'user-1');
    const review = await disputeService.changeStatus(
        dispute.id,
        'under_review',
        'agent-1',
        undefined,
        undefined,
        dispute.version
    );

    const rejected = await disputeService.changeStatus(
        dispute.id,
        'rejected',
        'risk-1',
        'Invalid claim',
        undefined,
        review.dispute.version
    );
        expect(rejected.dispute.status).toBe('rejected');
    });
});