import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../app/auth/contexts/AuthContext';
import { usuarioService } from '../services/usuario.service';

export function UserActivityTracker() {
  const { authenticated, isInitialized } = useAuth();
  const location = useLocation();
  const currentPath = useRef(location.pathname);

  useEffect(() => {
    currentPath.current = location.pathname;
    if (!isInitialized || !authenticated) return;
    usuarioService
      .registrarActividad('page_view', location.pathname)
      .catch(() => undefined);
  }, [authenticated, isInitialized, location.pathname]);

  useEffect(() => {
    if (!isInitialized || !authenticated) return;

    const reportPresence = () => {
      if (document.visibilityState === 'visible') {
        usuarioService
          .registrarActividad('presence', currentPath.current)
          .catch(() => undefined);
      }
    };

    reportPresence();
    const interval = window.setInterval(reportPresence, 60_000);
    window.addEventListener('focus', reportPresence);
    document.addEventListener('visibilitychange', reportPresence);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', reportPresence);
      document.removeEventListener('visibilitychange', reportPresence);
    };
  }, [authenticated, isInitialized]);

  return null;
}
