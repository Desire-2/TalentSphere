import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationToasts } from '../../hooks/useNotificationToasts';

const Layout = () => {
  const { initialize } = useAuthStore();
  const location = useLocation();

  // Initialize notification toasts for authenticated users
  useNotificationToasts();

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
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

