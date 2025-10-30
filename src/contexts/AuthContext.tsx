import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  code: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
  class: string;
  subject?: string;
  group_type?: string;
}

interface AuthContextType {
  user: User | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (code: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) {
      throw new Error('كود الدخول غير صحيح');
    }

    const userData: User = {
      code: data.code,
      role: data.role as 'admin' | 'teacher' | 'student',
      name: data.name,
      class: data.class,
      subject: data.subject,
      group_type: data.group_type,
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
