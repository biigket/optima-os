import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type Position = 'SALES' | 'PRODUCT' | 'SERVICE' | 'FINANCE' | 'SALES_MANAGER' | 'OWNER';

export interface MockSaleUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'SALE' | 'ADMIN';
  position: Position;
}

export const MOCK_SALES: MockSaleUser[] = [
  { id: 's0', name: 'ADMIN', username: 'admin', password: 'admin1234', role: 'ADMIN', position: 'OWNER' },
  { id: 's1', name: 'FORD', username: 'ford', password: 'ford1234', role: 'SALE', position: 'SALES' },
  { id: 's2', name: 'VARN', username: 'varn', password: 'varn1234', role: 'SALE', position: 'SALES' },
  { id: 's3', name: 'PETCH', username: 'petch', password: 'petch1234', role: 'SALE', position: 'SALES' },
  { id: 's4', name: 'FAH', username: 'fah', password: 'fah1234', role: 'SALE', position: 'SALES_MANAGER' },
  { id: 's5', name: 'VI', username: 'vi', password: 'vi1234', role: 'SALE', position: 'PRODUCT' },
  { id: 's6', name: 'NOT', username: 'not', password: 'not1234', role: 'SALE', position: 'SERVICE' },
  { id: 's7', name: 'GAME', username: 'game', password: 'game1234', role: 'SALE', position: 'FINANCE' },
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
    // Auto-login as ADMIN (login disabled)
    const adminUser = MOCK_SALES.find(u => u.role === 'ADMIN');
    return adminUser || null;
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
