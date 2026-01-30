 import type { Transaction } from '../types';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, onClose }: Props) {
  return (
    <div className="txn-modal-overlay" onClick={onClose}>
      <div
        className="txn-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="txn-modal-header">
          <h3>Transaction Details</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="txn-detail-grid">
          <Detail label="Transaction ID" value={transaction.id} />
          <Detail label="Customer" value={transaction.userName} />
          <Detail label="Amount" value={`$${transaction.amount}`} />
          <Detail label="Type" value={transaction.type} />
          <Detail label="Merchant" value={transaction.merchantName} />
          <Detail label="Card" value={`**** ${transaction.cardLast4}`} />
          <Detail
            label="Date"
            value={new Date(transaction.timestamp).toLocaleString()}
          />
          <Detail
            label="Status"
            value={transaction.status}
            badge
          />
        </div>

        <footer className="txn-modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="txn-detail-item">
      <label>{label}</label>
      {badge ? (
        <span className={`txn-status-badge txn-status-${value}`}>
          {value}
        </span>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}

