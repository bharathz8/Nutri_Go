import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: string;
  activity_level: string;
  goal: string;
  dietary_restrictions: string[];
  health_conditions: string[];
  preferred_language: string;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nutrigo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const updateUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('nutrigo_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('nutrigo_user');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nutrigo_user');
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser: updateUser,
      isLoggedIn: !!user,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};