import { useState, useEffect } from 'react';
import type { Transaction, DisputeFormData, DisputeDraft, DisputeReason, DisputePriority, DraftStatus } from '../types';
import { DISPUTE_WIZARD_STEPS, DISPUTE_CATEGORIES, DISPUTE_REASON_CODES } from '../constants';
import { useAuth } from '../context';
import { formatDateTime, formatAmount } from '../utils';
import MaskedField from './MaskedField';

interface DisputeWizardProps {
  transaction: Transaction;
  existingDraft?: DisputeDraft | null;
  onSubmit: (data: DisputeFormData) => void;
  onSaveDraft: (data: Partial<DisputeFormData>) => void;
  draftStatus: DraftStatus;
  onCancel: () => void; 
  isSubmitting: boolean;
}

interface WizardFormData {
  transactionId: string;
  category: string;
  reasonCode: string;
  reason: DisputeReason;
  priority: DisputePriority;
  description: string;
  requestedAmount: number;
  evidenceNotes: string;
}

export function DisputeWizard({
  transaction,
  existingDraft,
  onSubmit,
  onSaveDraft,
  draftStatus,
  onCancel,
  isSubmitting,
}: DisputeWizardProps) {
  const { currentUser, hasPermission } = useAuth();
  // const hasHydratedDraftRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(
    () => existingDraft?.step ?? 0
  );
  const [showResumeBanner, setShowResumeBanner] = useState(
    Boolean(existingDraft)
  );

  const [formData, setFormData] = useState<WizardFormData>(() => ({
    transactionId: transaction.id,
    category: existingDraft?.data?.reason
      ? getCategoryFromReason(existingDraft.data.reason)
      : '',
    reasonCode: existingDraft?.data?.reasonCode ?? '', 
    reason: existingDraft?.data?.reason || 'other',
    priority: existingDraft?.data?.priority || 'medium',
    description: existingDraft?.data?.description || '',
    requestedAmount:
      existingDraft?.data?.requestedAmount ?? transaction.amount,
    evidenceNotes: '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
  if (!formData.category && !formData.description) return;

  const timer = setTimeout(() => {
    const draftData: Partial<DisputeFormData> = {
      transactionId: formData.transactionId,
      category: formData.category,
      reasonCode: formData.reasonCode,
      reason: formData.reason,
      priority: formData.priority,
      description: formData.description,
      requestedAmount: formData.requestedAmount,
      evidence: [],
    };

    onSaveDraft(draftData);
    setShowResumeBanner(false);

  }, 5000);

  return () => clearTimeout(timer);
  }, [formData, onSaveDraft, transaction.id]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
      if (!formData.reasonCode) {
        newErrors.reasonCode = 'Please select a reason code';
      }
    }

    if (step === 1) {
      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      }
      if (formData.requestedAmount && formData.requestedAmount > transaction.amount) {
        newErrors.requestedAmount = 'Requested amount cannot exceed transaction amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, DISPUTE_WIZARD_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateStep(2)) {
      const submitData: DisputeFormData = {
        transactionId: formData.transactionId,
        reasonCode: formData.reasonCode, 
        reason: formData.reason,
        priority: formData.priority,
        description: formData.description,
        requestedAmount: formData.requestedAmount,
        evidence: [],
      };
      onSubmit(submitData);
    }
  };

  const updateField = <K extends keyof WizardFormData>(
    field: K,
    value: WizardFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    updateField('category', categoryId);
    updateField('reasonCode', '');
  };

  const handleReasonCodeChange = (code: string) => {
    updateField('reasonCode', code);
    const reasonMap: Record<string, DisputeReason> = {
      'FR01': 'unauthorized_transaction',
      'FR02': 'fraudulent_activity',
      'FR03': 'fraudulent_activity',
      'BI01': 'duplicate_charge',
      'BI02': 'incorrect_amount',
      'BI03': 'cancelled_subscription',
      'PR01': 'product_not_received',
      'PR02': 'product_not_as_described',
      'PR03': 'product_not_as_described',
      'OT01': 'other',
    };
    updateField('reason', reasonMap[code] || 'other');
  };

  const canSubmit = hasPermission('create_dispute');

  return (
    <div className="dispute-wizard">
      <div className="dispute-wizard-header">
        <h3>Create Dispute</h3>
        <div className="wizard-steps">
          {DISPUTE_WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{step.title}</span>
            </div>
          ))}
        </div>
        {draftStatus && draftStatus !== 'idle' && (
          <span className="draft-status">
            {draftStatus === 'saving' ? '💾 Saving...' : '✓ Draft saved'}
          </span>
        )}
        {showResumeBanner && (
          <span className="draft-status">
            ✨ Resumed draft
          </span>
        )}
      </div>

      <div className="dispute-wizard-transaction">
        <h4>Transaction Details</h4>
        <div className="transaction-summary">
          <div><strong>ID:</strong> {transaction.id}</div>
          <div><strong>Amount:</strong> <MaskedField value={transaction.amount} type="amount" /></div>
          <div><strong>Merchant:</strong> {transaction.merchantName}</div>
          <div><strong>Date:</strong> {formatDateTime(transaction.timestamp)}</div>
          <div><strong>Customer:</strong> <MaskedField value={transaction.userName} type="name" /></div>
        </div>
      </div>

      <div className="dispute-wizard-content">
        {currentStep === 0 && (
          <div className="wizard-step-content">
            <h4>{DISPUTE_WIZARD_STEPS[0].title}</h4>
            <p>{DISPUTE_WIZARD_STEPS[0].description}</p>

            <div className="form-group">
              <label htmlFor="category">Dispute Category *</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select a category...</option>
                {DISPUTE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reasonCode">Reason Code *</label>
              <select
                id="reasonCode"
                value={formData.reasonCode}
                onChange={(e) => handleReasonCodeChange(e.target.value)}
                className={errors.reasonCode ? 'error' : ''}
                disabled={!formData.category}
              >
                <option value="">Select a reason...</option>
                {DISPUTE_REASON_CODES
                  .filter(rc => rc.categoryId === formData.category)
                  .map(rc => (
                    <option key={rc.code} value={rc.code}>
                      {rc.code} - {rc.name}
                    </option>
                  ))}
              </select>
              {errors.reasonCode && <span className="error-message">{errors.reasonCode}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => updateField('priority', e.target.value as DisputePriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="wizard-step-content">
            <h4>{DISPUTE_WIZARD_STEPS[1].title}</h4>
            <p>{DISPUTE_WIZARD_STEPS[1].description}</p>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={errors.description ? 'error' : ''}
                rows={5}
                placeholder="Describe the dispute in detail..."
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <span className="char-count">{formData.description.length} / 20 min</span>
            </div>

            <div className="form-group">
              <label htmlFor="requestedAmount">Requested Amount</label>
              <input
                id="requestedAmount"
                type="number"
                step="0.01"
                min="0"
                max={transaction.amount}
                value={formData.requestedAmount}
                onChange={(e) => updateField('requestedAmount', parseFloat(e.target.value) || 0)}
                className={errors.requestedAmount ? 'error' : ''}
              />
              {errors.requestedAmount && <span className="error-message">{errors.requestedAmount}</span>}
              <span className="field-hint">Max: {formatAmount(transaction.amount, transaction.currency)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="evidenceNotes">Supporting Evidence Notes</label>
              <textarea
                id="evidenceNotes"
                value={formData.evidenceNotes}
                onChange={(e) => updateField('evidenceNotes', e.target.value)}
                rows={3}
                placeholder="List any evidence or reference numbers..."
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="wizard-step-content">
            <h4>{DISPUTE_WIZARD_STEPS[2].title}</h4>
            <p>{DISPUTE_WIZARD_STEPS[2].description}</p>

            <div className="review-summary">
              <div className="review-section">
                <h5>Category & Reason</h5>
                <p>
                  <strong>Category:</strong> {DISPUTE_CATEGORIES.find(c => c.id === formData.category)?.name}
                </p>
                <p>
                  <strong>Reason:</strong> {DISPUTE_REASON_CODES.find(r => r.code === formData.reasonCode)?.name}
                </p>
                <p>
                  <strong>Priority:</strong> <span className={`priority-badge priority-${formData.priority}`}>{formData.priority}</span>
                </p>
              </div>

              <div className="review-section">
                <h5>Details</h5>
                <p><strong>Description:</strong></p>
                <blockquote>{formData.description}</blockquote>
                <p><strong>Requested Amount:</strong> {formatAmount(formData.requestedAmount, transaction.currency)}</p>
                {formData.evidenceNotes && (
                  <>
                    <p><strong>Evidence Notes:</strong></p>
                    <blockquote>{formData.evidenceNotes}</blockquote>
                  </>
                )}
              </div>

              <div className="review-section">
                <h5>Created By</h5>
                <p><strong>Agent:</strong> {currentUser.name}</p>
                <p><strong>Role:</strong> {currentUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dispute-wizard-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>

        <div className="wizard-nav">
          {currentStep > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
            >
              ← Back
            </button>
          )}

          {currentStep < DISPUTE_WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}

function getCategoryFromReason(reason: DisputeReason): string {
  const mapping: Record<DisputeReason, string> = {
    unauthorized_transaction: 'fraud',
    fraudulent_activity: 'fraud',
    duplicate_charge: 'billing',
    incorrect_amount: 'billing',
    cancelled_subscription: 'billing',
    product_not_received: 'product',
    product_not_as_described: 'product',
    other: 'other',
  };
  return mapping[reason] || 'other';
}

export default DisputeWizard;

