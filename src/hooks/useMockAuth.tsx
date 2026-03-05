import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface MockSaleUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'SALE' | 'ADMIN';
}

export const MOCK_SALES: MockSaleUser[] = [
  { id: 's1', name: 'FORD', username: 'ford', password: 'ford1234', role: 'SALE' },
  { id: 's2', name: 'VARN', username: 'varn', password: 'varn1234', role: 'SALE' },
  { id: 's3', name: 'PETCH', username: 'petch', password: 'petch1234', role: 'SALE' },
  { id: 's4', name: 'FAH', username: 'fah', password: 'fah1234', role: 'SALE' },
  { id: 's5', name: 'VI', username: 'vi', password: 'vi1234', role: 'SALE' },
];

interface MockAuthContextType {
  currentUser: MockSaleUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const MockAuthContext = createContext<MockAuthContextType>({
  currentUser: null,
  login: () => false,
  logout: () => {},
});

const STORAGE_KEY = 'optima_mock_user';

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockSaleUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = MOCK_SALES.find(u => u.id === saved);
      return found || null;
    }
    return null;
  });

  const login = (username: string, password: string): boolean => {
    const user = MOCK_SALES.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MockAuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useMockAuth = () => useContext(MockAuthContext);
