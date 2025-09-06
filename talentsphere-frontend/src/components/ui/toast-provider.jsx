import React from 'react';
import { Toaster } from 'sonner';

/**
 * Toast notification component using Sonner
 * Provides consistent styling and configuration for all toast notifications
 */
export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand
        closeButton
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          className: 'toast-message',
          duration: 4000,
        }}
        theme="light"
      />
    </>
  );
};

export default ToastProvider;
