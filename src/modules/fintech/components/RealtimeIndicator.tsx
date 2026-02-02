interface RealtimeIndicatorProps {
  isConnected: boolean;
  isOnline: boolean;
  lastUpdate?: Date | null;
  eventCount?: number;
  onToggle?: () => void;
}

export function RealtimeIndicator({
  isConnected,
  isOnline,
  lastUpdate,
  eventCount,
  onToggle,
}: RealtimeIndicatorProps) {
  const isPaused = !isOnline || !isConnected;
  return (
    <div className={`realtime-indicator ${isPaused ? 'disconnected' : 'connected'}`}>
      <div className="realtime-status">
        <span className={`status-dot ${isConnected ? 'pulse' : ''}`}></span>
        <span className="status-text">
          {!isOnline
            ? 'Paused'
            : isConnected
            ? 'Live'
            : 'Paused'}
        </span>
      </div>
      {lastUpdate && isOnline && (
        <span className="last-update">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
      {eventCount !== undefined && eventCount > 0 && (
        <span className="event-count">{eventCount} events</span>
      )}
      {onToggle && isOnline && (
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
