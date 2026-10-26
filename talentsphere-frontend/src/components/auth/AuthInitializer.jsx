import { useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import './AuthInitializer.css';

function SessionLoading() {
  return (
    <div className="session-loading" role="status" aria-live="polite" aria-label="Checking your session">
      <div className="session-orbit session-orbit--outer" aria-hidden="true" />
      <div className="session-orbit session-orbit--inner" aria-hidden="true" />
      <div className="session-badge" aria-hidden="true"><KeyRound size={22} strokeWidth={1.8} /></div>
      <div className="session-copy">
        <strong>Checking your session</strong>
        <span>Preparing your workspace</span>
      </div>
      <div className="session-dots" aria-hidden="true"><span /><span /><span /></div>
    </div>
  );
}

const AuthInitializer = ({ children }) => {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    void initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <SessionLoading />;
  }

  return children;
};

export default AuthInitializer;
