import type { 
  Transaction, 
  TransactionSearchParams, 
  PaginatedResponse,
  TransactionStatus,
  TransactionType 
} from '../types';
 
const MERCHANTS = [
  'Amazon', 'Netflix', 'Spotify', 'Apple', 'Google', 'Uber', 'Airbnb',
  'Walmart', 'Target', 'Best Buy', 'Home Depot', 'Costco', 'Starbucks'
];

const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Emily'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

function generateMockTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const statuses: TransactionStatus[] = ['completed', 'pending', 'failed', 'refunded', 'disputed'];
  const types: TransactionType[] = ['payment', 'refund', 'transfer', 'withdrawal', 'deposit'];

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];

    transactions.push({
      id: `TXN-${String(1000 + i).padStart(6, '0')}`,
      userId: `USR-${String(100 + (i % 50)).padStart(5, '0')}`,
      userName: `${firstName} ${lastName}`,
      amount: Math.round((Math.random() * 5000 + 10) * 100) / 100,
      currency: 'USD',
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      merchantName: merchant,
      cardLast4: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
      accountNumber: `****${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      timestamp: thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo),
      description: `${types[Math.floor(Math.random() * types.length)]} at ${merchant}`,
    });
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

const MOCK_TRANSACTIONS = generateMockTransactions(200);

class TransactionService {
  private simulateDelay(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return Promise.resolve();
    }
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  }

  private simulateFailure(): boolean {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    return Math.random() < 0.05;
  }


  async searchTransactions(
    params: TransactionSearchParams,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Transaction>> {
    await this.simulateDelay();

    if (this.simulateFailure()) {
      throw new Error('Network error: Failed to fetch transactions');
    }

    let filtered = [...MOCK_TRANSACTIONS];

    // Apply filters
    if (params.transactionId) {
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(params.transactionId!.toLowerCase())
      );
    }

    if (params.userId) {
      filtered = filtered.filter(t => 
        t.userId.toLowerCase().includes(params.userId!.toLowerCase())
      );
    }

    if (params.userName) {
      filtered = filtered.filter(t => 
        t.userName.toLowerCase().includes(params.userName!.toLowerCase())
      );
    }

    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom).getTime();
      filtered = filtered.filter(t => t.timestamp >= fromDate);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo).getTime() + 24 * 60 * 60 * 1000;
      filtered = filtered.filter(t => t.timestamp <= toDate);
    }

    if (params.status) {
      filtered = filtered.filter(t => t.status === params.status);
    }

    if (params.type) {
      filtered = filtered.filter(t => t.type === params.type);
    }

    if (params.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= params.minAmount!);
    }

    if (params.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= params.maxAmount!);
    }

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.simulateDelay();

    if (this.simulateFailure()) {
      throw new Error('Network error: Failed to fetch transaction');
    }

    return MOCK_TRANSACTIONS.find(t => t.id === id) || null;
  }

  async getTransactionsByIds(ids: string[]): Promise<Transaction[]> {
    await this.simulateDelay();

    return MOCK_TRANSACTIONS.filter(t => ids.includes(t.id));
  }

  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<void> {
    await this.simulateDelay();

    const txn = MOCK_TRANSACTIONS.find(t => t.id === transactionId);
    if (txn) {
      txn.status = status;
    }
  }

}

export const transactionService = new TransactionService();

