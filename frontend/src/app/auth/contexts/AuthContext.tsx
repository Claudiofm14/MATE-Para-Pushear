import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { apiService } from '../../../shared/services/api.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type UserInfo = {
  username?: string;
  name?: string;
  given_name?: string;
  roles: string[];
  email?: string;
  giteaUser?: string;
  githubUser?: string;
};

type AuthClient = {
  authenticated: boolean;
  hasRealmRole: (role: string) => boolean;
  login: (callbackPath?: string) => void;
  logout: (...args: any[]) => void;
};

interface AuthContextType {
  auth: AuthClient | null;
  authenticated: boolean;
  token: string | null;
  userInfo: UserInfo | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isInitialized: boolean;
  login: (callbackPath?: string) => void;
  logout: (...args: any[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const hasRole = useCallback(
    (role: string): boolean => userInfo?.roles.includes(role) ?? false,
    [userInfo]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => roles.some(role => hasRole(role)),
    [hasRole]
  );

  const login = useCallback((callbackPath = '/materias') => {
    const safeCallbackPath = callbackPath.startsWith('/')
      ? callbackPath
      : '/materias';
    const callbackUrl = `${window.location.origin}${safeCallbackPath}`;

    fetch(`${API_BASE_URL}/config/auth-status`, { credentials: 'include' })
      .then(response => response.json())
      .then(config => {
        if (!config?.gitea?.enabled) {
          throw new Error(
            'Faltan GITEA_BASE_URL, GITEA_CLIENT_ID o GITEA_CLIENT_SECRET en backend/.env'
          );
        }
        if (!config?.authSecret?.configured) {
          throw new Error('Falta AUTH_SECRET en backend/.env');
        }
        return fetch(`${API_BASE_URL}/auth/csrf`, {
          credentials: 'include',
        });
      })
      .then(response => response.json())
      .then(({ csrfToken }) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${API_BASE_URL}/auth/signin/gitea`;
        form.style.display = 'none';

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfToken';
        csrfInput.value = csrfToken;

        const callbackInput = document.createElement('input');
        callbackInput.type = 'hidden';
        callbackInput.name = 'callbackUrl';
        callbackInput.value = callbackUrl;

        form.appendChild(csrfInput);
        form.appendChild(callbackInput);
        document.body.appendChild(form);
        form.submit();
      })
      .catch(error => {
        window.alert(error.message || 'Auth.js no esta configurado');
      });
  }, []);

  const logout = useCallback(async () => {
    let giteaLogoutUrl: string | null = null;

    try {
      try {
        const configResponse = await fetch(
          `${API_BASE_URL}/config/auth-status`,
          { credentials: 'include' }
        );
        if (configResponse.ok) {
          const config = await configResponse.json();
          giteaLogoutUrl = config?.gitea?.logoutUrl || null;
        }
      } catch {
        // El cierre local debe continuar aunque Gitea no esté disponible.
      }

      const csrfResponse = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: 'include',
      });
      const { csrfToken } = await csrfResponse.json();

      await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: window.location.origin,
        }),
      });
    } finally {
      setAuthenticated(false);
      setUserInfo(null);
      window.location.href = giteaLogoutUrl || window.location.origin;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
          credentials: 'include',
        });
        const session = await sessionResponse.json();

        if (!session?.user) {
          if (!cancelled) {
            setAuthenticated(false);
            setUserInfo(null);
          }
          return;
        }

        apiService.enableCredentials();
        const localUser = await apiService.get<any>('/api/usuario/me');

        if (!cancelled) {
          setAuthenticated(true);
          setUserInfo({
            username:
              session.user.giteaUser ||
              session.user.providerUsername ||
              session.user.githubUser ||
              localUser.githubUser ||
              session.user.email,
            name: session.user.name || localUser.nombre,
            given_name: localUser.nombre,
            email: session.user.email || localUser.email,
            giteaUser:
              session.user.giteaUser ||
              session.user.providerUsername ||
              session.user.githubUser ||
              localUser.githubUser,
            githubUser:
              session.user.giteaUser ||
              session.user.providerUsername ||
              session.user.githubUser ||
              localUser.githubUser,
            roles: localUser.rol ? [localUser.rol] : ['alumno'],
          });
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setUserInfo(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const auth = React.useMemo<AuthClient>(
    () => ({
      authenticated,
      hasRealmRole: hasRole,
      login,
      logout,
    }),
    [authenticated, hasRole, login, logout]
  );

  return (
    <AuthContext.Provider
      value={{
        auth,
        authenticated,
        isInitialized,
        token: null,
        userInfo,
        hasRole,
        hasAnyRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
