import { useState, useEffect } from 'react';
import Header from './components/Header';
import Notification from './components/Notification';
import { FinTechPage } from './modules/fintech';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);


  return (
    <div className="app-layout">
      <Header
        title="FinTech Transaction"
        onMenuClick={() => {}}
      />
      <main className="main-content">
        <FinTechPage />
      </main>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
