import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuthStore } from '../../stores/authStore';
import { useSessionManager } from '../../hooks/useSessionManager';

const Layout = () => {
  const { initialize } = useAuthStore();
  const location = useLocation();

  // Initialize session manager with custom handlers
  useSessionManager({
    onSessionExpired: () => {
      console.log('🔒 Session expired in main layout');
    },
    onSessionRefreshed: () => {
      console.log('🔄 Session refreshed in main layout');
    }
  });

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    initialize();
  }, [initialize]);
  
  useEffect(() => {
    console.log('🏠 Layout rendered for path:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

