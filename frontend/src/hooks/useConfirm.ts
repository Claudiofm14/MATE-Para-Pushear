import { useState, useCallback } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Hook para manejar diálogos de confirmación
 * Proporciona una forma sencilla de mostrar confirmaciones antes de acciones importantes
 *
 * @example
 * const { confirmState, confirm } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: '¿Eliminar semana?',
 *     message: 'Esta acción no se puede deshacer',
 *     variant: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     // Realizar la acción
 *   }
 * };
 */
export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  });

  /**
   * Muestra un diálogo de confirmación y retorna una promesa
   * que se resuelve con true si el usuario confirma, false si cancela
   */
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({
        ...options,
        isOpen: true,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'danger',
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  return {
    confirmState,
    confirm,
  };
};

export default useConfirm;
