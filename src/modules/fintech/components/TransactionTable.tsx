import type { Transaction } from '../types';
import { MaskedField } from './MaskedField';
import { formatDateTime } from '../utils';
import { useAuth } from '../context';

interface TransactionTableProps {
  transactions: Transaction[];
  selectedId: string | null;
  onSelect: (transaction: Transaction) => void;
  onViewDetails: (transaction: Transaction) => void;
  isLoading: boolean;
}

export function TransactionTable({
  transactions,
  selectedId,
  onSelect,
  onViewDetails,
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
            const isSelectable = txn.status === 'completed';

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
                    value={canViewCustomerDetails ? txn.currency : '****'}
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
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSelectable) return;
                      onSelect(txn);
                    }}
                    disabled={!isSelectable}
                  >
                    {isSelectable ? 'Select' : 'Disputed'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
