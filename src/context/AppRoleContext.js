import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppRoleContext = createContext({ role: 'student', setRole: async () => {} });
const ROLE_KEY = 'bona_app_role';

export const AppRoleProvider = ({ children }) => {
  const [role, setRoleState] = useState('student');

  useEffect(() => {
    AsyncStorage.getItem(ROLE_KEY).then((saved) => {
      if (saved === 'teacher' || saved === 'student') setRoleState(saved);
    });
  }, []);

  const setRole = async (nextRole) => {
    const safeRole = nextRole === 'teacher' ? 'teacher' : 'student';
    setRoleState(safeRole);
    await AsyncStorage.setItem(ROLE_KEY, safeRole);
  };

  return <AppRoleContext.Provider value={{ role, isTeacher: role === 'teacher', setRole }}>{children}</AppRoleContext.Provider>;
};

export const useAppRole = () => useContext(AppRoleContext);
