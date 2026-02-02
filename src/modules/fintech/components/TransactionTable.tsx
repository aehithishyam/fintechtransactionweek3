import type { Transaction, DisputeDraft } from '../types';
import { MaskedField } from './MaskedField';
import { formatDateTime } from '../utils';
import { useAuth } from '../context';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedId: string | null;
  onSelect: (transaction: Transaction) => void;
  onViewDetails: (transaction: Transaction) => void;
  getDraftByTransactionId: (transactionId: string) => DisputeDraft | null;
  onResume: (draft: DisputeDraft, transaction: Transaction) => void;
  isLoading: boolean;
}

export function TransactionTable({
  transactions,
  selectedId,
  onSelect,
  onViewDetails,
  getDraftByTransactionId,
  onResume,
  isLoading,
}: TransactionTableProps) {
  const { hasPermission } = useAuth();
  const canViewCustomerDetails = hasPermission('view_full_data');

  if (isLoading) {
    return (
      <div className="transaction-table-loading">
        <div className="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="transaction-table-empty">
        <span className="empty-icon">📋</span>
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Merchant</th>
            <th>Card</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map(txn => {
            
            return (
              <tr
                key={txn.id}
                className={selectedId === txn.id ? 'selected' : ''}
              >
                <td className="txn-id">{txn.id}</td>

                {/* 🔐 Permission-controlled customer details */}
                <td
                  className={`txn-customer ${
                    canViewCustomerDetails ? 'clickable' : 'masked'
                  }`}
                  onClick={(e) => {
                    if (!canViewCustomerDetails) return;
                    e.stopPropagation();
                    onViewDetails(txn);
                  }}
                >
                  <MaskedField
                    value={canViewCustomerDetails ? txn.userName : '****'}
                    type="name"
                  />
                </td>

                <td className="txn-amount">
                  <MaskedField
                    value={
                      canViewCustomerDetails
                        ? `${txn.amount} ${txn.currency}`
                        : '****'
                    }
                    type="amount"
                  />
                </td>

                <td>
                  <span className={`txn-type txn-type--${txn.type}`}>
                    {txn.type}
                  </span>
                </td>

                <td>{txn.merchantName}</td>

                <td>
                  <MaskedField
                    value={canViewCustomerDetails ? txn.cardLast4 : '****'}
                    type="card"
                  />
                </td>

                <td className="txn-date">
                  {formatDateTime(txn.timestamp)}
                </td>

                <td>
                  <span className={`txn-status txn-status--${txn.status}`}>
                    {txn.status}
                  </span>
                </td>

                <td>
                  {(() => {
                    const isCompleted = txn.status === 'completed';

                    const isTerminalDispute = [
                      'disputed',
                      'approved',
                      'refunded',
                      'settled',
                      'rejected',
                    ].includes(txn.status);

                    const isBlocked = ['pending', 'failed'].includes(txn.status);

                    const draft = getDraftByTransactionId(txn.id);

                    // 1️⃣ Terminal dispute → Disputed
                    if (isTerminalDispute) {
                      return (
                        <button className="btn btn-sm btn-primary" disabled>
                          Disputed
                        </button>
                      );
                    }

                    // 2️⃣ Pending / Failed → Disabled
                    if (isBlocked) {
                      return (
                        <button className="btn btn-sm btn-secondary" disabled>
                          Not eligible
                        </button>
                      );
                    }

                    // 3️⃣ Completed + Draft → Resume
                    if (draft && isCompleted) {
                      return (
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResume(draft, txn);
                          }}
                        >
                          ▶ Resume
                        </button>
                      );
                    }

                    // 4️⃣ Completed (no draft) → Select
                    if (isCompleted) {
                      return (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(txn);
                          }}
                        >
                          Select
                        </button>
                      );
                    }
                    // 5️⃣ Safety fallback (should never hit)
                    return null;
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
