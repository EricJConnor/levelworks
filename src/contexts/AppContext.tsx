import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  loading: boolean;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  loading: true,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Get initial session with retry
    const checkAuthWithRetry = async (retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return session;
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
      }
      return null;
    };
    
    checkAuthWithRetry().then((session) => {
      if (!mountedRef.current) return;
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
      } else {
        localStorage.removeItem('userId');
      }
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, user, loading }}>
      {children}
    </AppContext.Provider>
  );
};