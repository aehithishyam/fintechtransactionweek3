interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date | null;
  eventCount?: number;
  onToggle?: () => void;
}
 
export function RealtimeIndicator({
  isConnected,
  lastUpdate,
  eventCount,
  onToggle,
}: RealtimeIndicatorProps) {
  return (
    <div className={`realtime-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="realtime-status">
        <span className={`status-dot ${isConnected ? 'pulse' : ''}`}></span>
        <span className="status-text">
          {isConnected ? 'Live' : 'Paused'}
        </span>
      </div>
      {lastUpdate && (
        <span className="last-update">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
      {eventCount !== undefined && eventCount > 0 && (
        <span className="event-count">{eventCount} events</span>
      )}
      {onToggle && (
        <button
          className="btn btn-icon realtime-toggle"
          onClick={onToggle}
          title={isConnected ? 'Pause updates' : 'Resume updates'}
        >
          {isConnected ? '⏸' : '▶'}
        </button>
      )}
    </div>
  );
}

export default RealtimeIndicator;

