import { useMemo } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para mostrar notificaciones toast.
 * Devuelve una API estable para que no dispare efectos de React en loop.
 */
export const useToast = () => {
  return useMemo(
    () => ({
      success: (message: string) => {
        toast.success(message, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        });
      },

      error: (message: string) => {
        toast.error(message, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        });
      },

      warning: (message: string) => {
        toast(message, {
          duration: 3500,
          position: 'top-right',
          icon: '!',
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });
      },

      info: (message: string) => {
        toast(message, {
          duration: 3000,
          position: 'top-right',
          icon: 'i',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
      },

      loading: (message: string) => {
        return toast.loading(message, {
          position: 'top-right',
        });
      },

      dismiss: (toastId?: string) => {
        toast.dismiss(toastId);
      },

      dismissAll: () => {
        toast.dismiss();
      },
    }),
    []
  );
};

export default useToast;
