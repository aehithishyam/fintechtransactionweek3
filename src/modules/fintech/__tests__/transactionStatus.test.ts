// Cross-system workflow effects
import { describe, test, expect } from 'vitest';
import { disputeService } from '../services/disputeService';
import { transactionService } from '../services/transactionService';
import type { DisputeFormData } from '../types';

describe('Transaction status reconciliation', () => {

  test('transaction becomes disputed when dispute is created', async () => {
    const form: DisputeFormData = {
      transactionId: 'TXN-001000',
      reason: 'fraudulent_activity',
      priority: 'high',
      description: 'Unauthorized transaction',
      requestedAmount: 150,
      evidence: [],
    };

    const dispute = await disputeService.createDispute(form, 'user-1');

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(dispute.status).toBe('created');
    expect(txn?.status).toBe('disputed');
  });

  test('transaction becomes refunded after approval', async () => {
    const form: DisputeFormData = {
      transactionId: 'TXN-001001',
      reason: 'fraudulent_activity',
      priority: 'high',
      description: 'Fraud case',
      requestedAmount: 200,
      evidence: [],
    };

    const dispute = await disputeService.createDispute(form, 'user-1');

    const review = await disputeService.changeStatus(
      dispute.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      dispute.version
    );

    const approved = await disputeService.changeStatus(
      dispute.id,
      'approved',
      'risk-1',
      'Approved',
      200,
      review.dispute.version
    );

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(approved.dispute.status).toBe('approved');
    expect(txn?.status).toBe('refunded');
  });

  test('transaction remains refunded after settlement', async () => {
    const form: DisputeFormData = {
      transactionId: 'TXN-001002',
      reason: 'fraudulent_activity',
      priority: 'high',
      description: 'Settlement test',
      requestedAmount: 300,
      evidence: [],
    };

    const dispute = await disputeService.createDispute(form, 'user-1');

    const review = await disputeService.changeStatus(
      dispute.id,
      'under_review',
      'agent-1',
      undefined,
      undefined,
      dispute.version
    );

    const approved = await disputeService.changeStatus(
      dispute.id,
      'approved',
      'risk-1',
      'Approved',
      300,
      review.dispute.version
    );

    const settled = await disputeService.changeStatus(
      dispute.id,
      'settled',
      'finance-1',
      'Refund completed',
      undefined,
      approved.dispute.version
    );

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(settled.dispute.status).toBe('settled');
    expect(txn?.status).toBe('refunded');
  },15000);

  test('transaction returns to completed when dispute is rejected', async () => {
    const form: DisputeFormData = {
      transactionId: 'TXN-001003',
      reason: 'incorrect_amount',
      priority: 'medium',
      description: 'Invalid claim',
      requestedAmount: 50,
      evidence: [],
    };

    const dispute = await disputeService.createDispute(form, 'user-1');

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

    const txn = await transactionService.getTransactionById(form.transactionId);

    expect(rejected.dispute.status).toBe('rejected');
    expect(txn?.status).toBe('completed');
  },15000);

});
