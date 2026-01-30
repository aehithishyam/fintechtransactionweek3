import type { RealtimeEvent, RealtimeEventType, Dispute } from '../types';

type EventCallback = (event: RealtimeEvent) => void;

class RealtimeService {
  private listeners: Map<string, EventCallback[]> = new Map();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private eventQueue: RealtimeEvent[] = [];
  private eventIdCounter = 1;
  private isConnected = false;
 
  connect(): void {
    if (this.isConnected) return;
    
    this.isConnected = true;
    this.pollInterval = setInterval(() => {
      this.processEventQueue();
    }, 1000);
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  subscribe(disputeId: string, callback: EventCallback): () => void {
    const existing = this.listeners.get(disputeId) || [];
    this.listeners.set(disputeId, [...existing, callback]);

    return () => {
      const callbacks = this.listeners.get(disputeId) || [];
      this.listeners.set(
        disputeId,
        callbacks.filter(cb => cb !== callback)
      );
    };
  }

  subscribeAll(callback: EventCallback): () => void {
    return this.subscribe('*', callback);
  }

  emit(
    type: RealtimeEventType,
    disputeId: string,
    payload: Record<string, unknown>,
    actorId: string
  ): void {
    const event: RealtimeEvent = {
      id: `EVT-${String(this.eventIdCounter++).padStart(6, '0')}`,
      type,
      disputeId,
      payload,
      timestamp: Date.now(),
      actorId,
    };

    this.eventQueue.push(event);
  }

  simulateExternalStatusChange(
    disputeId: string,
    newStatus: string,
    actorId: string
  ): void {
    this.emit('dispute_status_changed', disputeId, { newStatus }, actorId);
  }

  simulateConflict(
    disputeId: string,
    serverVersion: number,
    serverData: Partial<Dispute>
  ): void {
    this.emit('conflict_detected', disputeId, { serverVersion, serverData }, 'system');
  }

  private processEventQueue(): void {
    if (!this.isConnected || this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    events.forEach(event => {
      const disputeListeners = this.listeners.get(event.disputeId) || [];
      disputeListeners.forEach(callback => callback(event));

      const globalListeners = this.listeners.get('*') || [];
      globalListeners.forEach(callback => callback(event));
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();

