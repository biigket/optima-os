import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Position = 'SALES' | 'PRODUCT' | 'SERVICE' | 'FINANCE' | 'SALES_MANAGER' | 'OWNER';

export interface MockSaleUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'USER' | 'ADMIN';
  position: Position;
}

// Fallback hardcoded users (used while DB loads)
const FALLBACK_USERS: MockSaleUser[] = [
  { id: 's0', name: 'ADMIN', username: 'admin', password: 'admin1234', role: 'ADMIN', position: 'OWNER' },
  { id: 's1', name: 'FORD', username: 'ford', password: 'ford1234', role: 'USER', position: 'SALES' },
  { id: 's2', name: 'VARN', username: 'varn', password: 'varn1234', role: 'USER', position: 'SALES' },
  { id: 's3', name: 'PETCH', username: 'petch', password: 'petch1234', role: 'USER', position: 'SALES' },
  { id: 's4', name: 'FAH', username: 'fah', password: 'fah1234', role: 'USER', position: 'SALES_MANAGER' },
  { id: 's5', name: 'VI', username: 'vi', password: 'vi1234', role: 'USER', position: 'PRODUCT' },
  { id: 's6', name: 'NOT', username: 'not', password: 'not1234', role: 'USER', position: 'SERVICE' },
  { id: 's7', name: 'GAME', username: 'game', password: 'game1234', role: 'USER', position: 'FINANCE' },
];

interface MockAuthContextType {
  currentUser: MockSaleUser | null;
  allUsers: MockSaleUser[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType>({
  currentUser: null,
  allUsers: [],
  login: () => false,
  logout: () => {},
  refreshUsers: async () => {},
});

const STORAGE_KEY = 'optima_mock_user';

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<MockSaleUser[]>(FALLBACK_USERS);
  const [currentUser, setCurrentUser] = useState<MockSaleUser | null>(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('mock_users')
      .select('*')
      .eq('is_active', true)
      .order('created_at');
    
    if (!error && data && data.length > 0) {
      const mapped: MockSaleUser[] = data.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password,
        role: (u.role === 'SALE' ? 'USER' : u.role) as 'USER' | 'ADMIN',
        position: u.position as Position,
      }));
      setAllUsers(mapped);
      return mapped;
    }
    return FALLBACK_USERS;
  };

  useEffect(() => {
    fetchUsers().then((users) => {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const found = users.find(u => u.id === savedId);
        if (found) setCurrentUser(found);
      }
      setDbLoaded(true);
    });
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = allUsers.find(
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

  const refreshUsers = async () => {
    const users = await fetchUsers();
    // Update current user if still exists
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  };

  if (!dbLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <MockAuthContext.Provider value={{ currentUser, allUsers, login, logout, refreshUsers }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export const useMockAuth = () => useContext(MockAuthContext);

// Keep MOCK_SALES export for backward compatibility (login page test accounts display)
export const MOCK_SALES = FALLBACK_USERS;
