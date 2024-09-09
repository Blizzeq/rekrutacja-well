import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { signInAnonymously, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Dialog, DialogContent, Box, CircularProgress, Typography } from '@mui/material';

const UserContext = createContext<User | null>(null);

export const useUser = () => useContext(UserContext);

type AuthProps = {
  children: ReactNode
}

const Auth: React.FC<AuthProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const signInUser = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Error signing in anonymously:', error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTimeout(() => {
          setUser(user);
          setIsLoading(false);
        }, 2000);
      } else {
        signInUser();
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <Dialog open>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={3}>
            <CircularProgress />
            <Typography variant="h6" mt={2}>Anonimowe logowanie...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default Auth;