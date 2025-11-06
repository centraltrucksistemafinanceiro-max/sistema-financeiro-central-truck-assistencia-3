import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Driver, Admin } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTrips } from './TripContext';
import { verifyPassword, generateSalt, hashPassword } from '../utils/crypto';
import { getFirebaseDb } from '../firebase/config';

interface User {
  name: string;
  role: 'admin' | 'driver';
  driverId: string | null; // For driver-specific views
  userId: string;
}

interface Session {
  user: User | null;
}

interface SessionContextType {
  session: Session;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (userId: string, userType: 'driver' | 'admin', newPassword: string, oldPassword?: string) => Promise<{ success: boolean; message: string; }>;
  currentDriverId: string | null;
  currentDriver: Driver | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useLocalStorage<Session>('session', { user: null });
  const { drivers, getDriver } = useTrips();

  const login = async (username: string, password: string): Promise<boolean> => {
    const upperUsername = username.toUpperCase();
    const db = getFirebaseDb();
    
    try {
      // Check admins
      const adminQuery = await db.collection('admins').where('name', '==', upperUsername).limit(1).get();
      if (!adminQuery.empty) {
        const adminDoc = adminQuery.docs[0];
        const admin = { id: adminDoc.id, ...adminDoc.data() } as Admin;
        if (admin.salt && admin.passwordHash) {
          const isValid = await verifyPassword(password, admin.salt, admin.passwordHash);
          if (isValid) {
            setSession({ user: { name: `${admin.name} (Admin)`, role: 'admin', driverId: null, userId: admin.id } });
            return true;
          }
        }
      }

      // Check drivers
      const driverQuery = await db.collection('drivers').where('name', '==', upperUsername).limit(1).get();
      if (!driverQuery.empty) {
        const driverDoc = driverQuery.docs[0];
        const driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
         if (driver.salt && driver.passwordHash) {
            const isValid = await verifyPassword(password, driver.salt, driver.passwordHash);
            if (isValid) {
              setSession({ user: { name: driver.name, role: 'driver', driverId: driver.id, userId: driver.id } });
              return true;
            }
         }
      }
    } catch (error) {
        console.error("Login error:", error);
        return false;
    }
    
    return false;
  };

  const logout = () => {
    setSession({ user: null });
  };

  const changePassword = async (userId: string, userType: 'driver' | 'admin', newPassword: string, oldPassword?: string): Promise<{ success: boolean, message: string }> => {
    const db = getFirebaseDb();
    const collectionName = userType === 'driver' ? 'drivers' : 'admins';
    const userDocRef = db.collection(collectionName).doc(userId);
    
    try {
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            return { success: false, message: 'Usuário não encontrado.' };
        }
        const userToUpdate = userDoc.data();

        // If oldPassword is provided, a user is changing their own password
        if (oldPassword) {
            if (!userToUpdate.salt || !userToUpdate.passwordHash) {
                return { success: false, message: 'Conta de usuário antiga. Contate um administrador para resetar sua senha.' };
            }
            const isMatch = await verifyPassword(oldPassword, userToUpdate.salt, userToUpdate.passwordHash);
            if (!isMatch) {
                return { success: false, message: 'Senha atual incorreta.' };
            }
        } 
        // If oldPassword is NOT provided, an admin is resetting a password
        else {
            if (session.user?.role !== 'admin') {
                return { success: false, message: 'Apenas administradores podem resetar senhas.' };
            }
        }
        
        const newSalt = generateSalt();
        const newHash = await hashPassword(newPassword, newSalt);

        await userDocRef.update({ passwordHash: newHash, salt: newSalt });
        return { success: true, message: 'Senha alterada com sucesso!' };

    } catch (error) {
        console.error("Change password error:", error);
        return { success: false, message: 'Ocorreu um erro ao alterar a senha.'};
    }
  };

  const currentDriverId = useMemo(() => session.user?.driverId || null, [session]);
  const currentDriver = useMemo(() => {
    // getDriver uses the real-time list from TripContext, which is efficient.
    return currentDriverId ? getDriver(currentDriverId) : undefined;
  }, [currentDriverId, getDriver, drivers]); // add drivers to dependency array

  const value = { session, login, logout, currentDriverId, currentDriver, changePassword };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
