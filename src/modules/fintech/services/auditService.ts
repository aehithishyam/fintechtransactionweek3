import type { AuditLogEntry, AuditAction, UserRole } from '../types';

let mutableLog: AuditLogEntry[] = [];
let auditIdCounter = 1;

class AuditService {
  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  async logAction(
    disputeId: string,
    action: AuditAction,
    actor: { id: string; name: string; role: UserRole },
    details: Record<string, unknown> = {},
    previousValue?: unknown,
    newValue?: unknown
  ): Promise<AuditLogEntry> {
    await this.simulateDelay();

    const entry: AuditLogEntry = Object.freeze({
      id: `AUD-${String(auditIdCounter++).padStart(8, '0')}`,
      disputeId,
      action,
      actor: Object.freeze({ ...actor }),
      timestamp: Date.now(),
      details: Object.freeze({ ...details }),
      previousValue,
      newValue,
    });

    mutableLog = [entry, ...mutableLog];

    return entry;
  }

  async getDisputeAuditLog(disputeId: string): Promise<readonly AuditLogEntry[]> {
    await this.simulateDelay();

    return Object.freeze(
      mutableLog
        .filter(entry => entry.disputeId === disputeId)
        .map(entry => ({ ...entry }))
    );
  }

  async getAllAuditLogs(
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ entries: readonly AuditLogEntry[]; total: number }> {
    await this.simulateDelay();

    const startIndex = (page - 1) * pageSize;
    const entries = Object.freeze(
      mutableLog.slice(startIndex, startIndex + pageSize)
    );

    return {
      entries,
      total: mutableLog.length,
    };
  }

  async getAuditLogsByActor(actorId: string): Promise<readonly AuditLogEntry[]> {
    await this.simulateDelay();

    return Object.freeze(
      mutableLog.filter(entry => entry.actor.id === actorId)
    );
  }

  async getAuditLogsByAction(action: AuditAction): Promise<readonly AuditLogEntry[]> {
    await this.simulateDelay();

    return Object.freeze(
      mutableLog.filter(entry => entry.action === action)
    );
  }

  async getAuditLogsByDateRange(
    startDate: number,
    endDate: number
  ): Promise<readonly AuditLogEntry[]> {
    await this.simulateDelay();

    return Object.freeze(
      mutableLog.filter(
        entry => entry.timestamp >= startDate && entry.timestamp <= endDate
      )
    );
  }

  async exportAuditLog(disputeId?: string): Promise<string> {
    await this.simulateDelay();

    const entries = disputeId 
      ? mutableLog.filter(e => e.disputeId === disputeId)
      : mutableLog;

    return JSON.stringify(entries, null, 2);
  }

  getAuditStats(): {
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByActor: Record<string, number>;
  } {
    const entriesByAction: Record<string, number> = {};
    const entriesByActor: Record<string, number> = {};

    mutableLog.forEach(entry => {
      entriesByAction[entry.action] = (entriesByAction[entry.action] || 0) + 1;
      entriesByActor[entry.actor.name] = (entriesByActor[entry.actor.name] || 0) + 1;
    });

    return {
      totalEntries: mutableLog.length,
      entriesByAction,
      entriesByActor,
    };
  }
}

export const auditService = new AuditService();
