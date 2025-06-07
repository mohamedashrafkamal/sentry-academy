import { useContext } from 'react';
import { UserStateContext } from '../contexts/UserStateContext';

export const useUserState = () => {
  const context = useContext(UserStateContext);
  if (context === undefined) {
    throw new Error('useUserState must be used within a UserStateProvider');
  }
  return context;
};