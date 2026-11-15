import { useEffect, useState } from 'react';
import { clearSession, login, validateSession } from './authSession';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isSessionLoading, setSessionLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState('loading');

  useEffect(() => {
    let isMounted = true;

    validateSession()
      .then((sessionUser) => {
        if (isMounted) {
          setUser(sessionUser);
          setSessionStatus(sessionUser ? 'authenticated' : 'unauthenticated');
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setSessionStatus('unauthenticated');
        }
      })
      .finally(() => {
        if (isMounted) setSessionLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const authenticate = async (email, password) => {
    const response = await login(email, password);
    setUser(response.user);
    setSessionStatus('authenticated');
    return response;
  };

  // Recarrega o usuário a partir da sessão do servidor (GET /api/session), que
  // devolve o saldo atualizado. Usado após ações que mudam o saldo (ex.: pagar
  // um pedido, recarregar saldo), para que o contexto não fique com o valor antigo.
  const refreshUser = async () => {
    const sessionUser = await validateSession();
    setUser(sessionUser);
    setSessionStatus(sessionUser ? 'authenticated' : 'unauthenticated');
    return sessionUser;
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
    setSessionStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, isSessionLoading, sessionStatus, isAuthenticated: Boolean(user), authenticate, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
