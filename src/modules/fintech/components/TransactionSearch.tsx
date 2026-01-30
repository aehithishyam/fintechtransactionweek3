import { useState } from 'react';
import type { TransactionSearchParams, TransactionStatus, TransactionType } from '../types';

interface TransactionSearchProps {
  onSearch: (params: TransactionSearchParams) => void;
  isLoading: boolean;
}

export function TransactionSearch({ onSearch, isLoading }: TransactionSearchProps) {
  const [transactionId, setTransactionId] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [type, setType] = useState<TransactionType | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      transactionId: transactionId || undefined,
      userId: userId || undefined,
      userName: userName || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || undefined,
      type: type || undefined,
    });
  };

  const handleClear = () => {
    setTransactionId('');
    setUserId('');
    setUserName('');
    setDateFrom('');
    setDateTo('');
    setStatus('');
    setType('');
    onSearch({});
  };

  return (
    <form className="transaction-search" onSubmit={handleSubmit}>
      <div className="transaction-search-main">
        <div className="search-field">
          <label htmlFor="txnId">Transaction ID</label>
          <input
            id="txnId"
            type="text"
            placeholder="TXN-XXXXXX"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
        </div>
        <div className="search-field">
          <label htmlFor="userName">Customer Name</label>
          <input
            id="userName"
            type="text"
            placeholder="Search by name..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="search-field">
          <label htmlFor="dateFrom">From Date</label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="search-field">
          <label htmlFor="dateTo">To Date</label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="search-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>

      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
      </button>

      {showAdvanced && (
        <div className="transaction-search-advanced">
          <div className="search-field">
            <label htmlFor="userId">User ID</label>
            <input
              id="userId"
              type="text"
              placeholder="USR-XXXXX"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="transfer">Transfer</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="deposit">Deposit</option>
            </select>
          </div>
        </div>
      )}
    </form>
  );
}

export default TransactionSearch;
