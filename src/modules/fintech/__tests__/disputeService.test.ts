// Service workflow tests
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { disputeService } from '../services/disputeService';
import { transactionService } from '../services/transactionService';
import { auditService } from '../services/auditService';
import type { DisputeFormData } from '../types';

function baseForm(txnId: string): DisputeFormData {
  return {
    transactionId: txnId,
    reason: 'fraudulent_activity',
    priority: 'high',
    description: 'Test dispute',
    requestedAmount: 200,
    evidence: [],
  };
}

beforeEach(() => {
  vi.restoreAllMocks();

  // Disable randomness & delays
  vi.spyOn(disputeService as any, 'simulateFailure').mockReturnValue(false);
  vi.spyOn(disputeService as any, 'simulateDelay').mockResolvedValue(undefined);
  vi.spyOn(transactionService as any, 'simulateDelay').mockResolvedValue(undefined);
  vi.spyOn(auditService, 'logAction').mockResolvedValue({} as any);
});

describe('DisputeService', () => {
  test('creates dispute and marks transaction as disputed', async () => {
    const form = baseForm('TXN-001001');

    const dispute = await disputeService.createDispute(form, 'user-1');

    expect(dispute.status).toBe('created');

    const txn = await transactionService.getTransactionById(form.transactionId);
    expect(txn?.status).toBe('disputed');
  });

  test('fetches dispute by id', async () => {
    const form = baseForm('TXN-001002');
    const created = await disputeService.createDispute(form, 'user-1');

    const found = await disputeService.getDisputeById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  test('filters disputes by status', async () => {
    const form = baseForm('TXN-001003');
    const created = await disputeService.createDispute(form, 'user-1');

    const result = await disputeService.getDisputes(1, 10, { status: 'created' });

    expect(result.data.find(d => d.id === created.id)).toBeTruthy();
  });

  test('detects version conflict when updating', async () => {
    const form = baseForm('TXN-001004');
    const created = await disputeService.createDispute(form, 'user-1');

    const result = await disputeService.updateDispute(created.id, { description: 'x' }, 999);

    expect(result.conflict).toBe(true);
  });

  test('changes status to under_review', async () => {
    const form = baseForm('TXN-001005');
    const created = await disputeService.createDispute(form, 'user-1');

    const result = await disputeService.changeStatus(
      created.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      created.version
    );

    expect(result.dispute.status).toBe('under_review');
  });

  test('approves dispute and refunds transaction', async () => {
    const form = baseForm('TXN-001006');
    const created = await disputeService.createDispute(form, 'user-1');

    const review = await disputeService.changeStatus(
      created.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      created.version
    );

    const approved = await disputeService.changeStatus(
      created.id,
      'approved',
      'risk-1',
      'ok',
      200,
      review.dispute.version
    );

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(approved.dispute.status).toBe('approved');
    expect(txn?.status).toBe('refunded');
  });

  test('settles dispute and keeps transaction refunded', async () => {
    const form = baseForm('TXN-001007');
    const created = await disputeService.createDispute(form, 'user-1');

    const review = await disputeService.changeStatus(
      created.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      created.version
    );

    const approved = await disputeService.changeStatus(
      created.id,
      'approved',
      'risk-1',
      'ok',
      200,
      review.dispute.version
    );

    const settled = await disputeService.changeStatus(
      created.id,
      'settled',
      'finance-1',
      'done',
      undefined,
      approved.dispute.version
    );

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(settled.dispute.status).toBe('settled');
    expect(txn?.status).toBe('refunded');
  });

  test('rejects dispute and restores transaction to completed', async () => {
    const form = baseForm('TXN-001008');
    const created = await disputeService.createDispute(form, 'user-1');

    const review = await disputeService.changeStatus(
      created.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      created.version
    );

    const rejected = await disputeService.changeStatus(
      created.id,
      'rejected',
      'risk-1',
      'invalid',
      undefined,
      review.dispute.version
    );

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(rejected.dispute.status).toBe('rejected');
    expect(txn?.status).toBe('completed');
  });

  test('assigns dispute to user', async () => {
    const form = baseForm('TXN-001009');
    const created = await disputeService.createDispute(form, 'user-1');

    const assigned = await disputeService.assignDispute(created.id, 'user-99');

    expect(assigned.assignedTo?.id).toBe('user-99');
  });

  test('saves and loads draft', async () => {
    const draft = await disputeService.saveDraft(
      { transactionId: 'TXN-009999', description: 'draft' },
      1
    );

    const loaded = await disputeService.getDraftById(draft.id);

    expect(loaded?.id).toBe(draft.id);
  });

  test('deletes dispute', async () => {
    const form = baseForm('TXN-001010');
    const created = await disputeService.createDispute(form, 'user-1');

    await disputeService.deleteDispute(created.id);

    const found = await disputeService.getDisputeById(created.id);

    expect(found).toBeNull();
  });

  test('counts disputes by status', async () => {
    const counts = disputeService.getDisputeCountByStatus();

    expect(counts).toHaveProperty('created');
    expect(counts).toHaveProperty('approved');
    expect(counts).toHaveProperty('settled');
  });
});
