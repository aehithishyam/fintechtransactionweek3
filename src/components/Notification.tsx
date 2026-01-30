interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

function Notification({ message, type, onClose }: NotificationProps) {
  return (
    <div className={`notification ${type}`}>
      <div className="notification-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
      </div>
      <p className="notification-message">{message}</p>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Notification;
