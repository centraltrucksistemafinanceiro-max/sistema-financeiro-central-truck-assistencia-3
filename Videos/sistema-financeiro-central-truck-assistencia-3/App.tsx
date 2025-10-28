import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import Login from './components/Login';
import Desktop from './components/Desktop';
import { getAllContasPagar, getAllFluxoCaixa, getAllFaturamentoComNF, getAllFaturamentoSemNF } from './services/supabase';
import { AppData } from './types';
import { WALLPAPERS, THEME_COLORS, CheckCircleIcon, ExclamationCircleIcon } from './constants';

// --- Settings Context ---
interface Settings {
    wallpaper: string;
    themeColor: string;
}
interface SettingsContextType extends Settings {
    setWallpaper: (url: string) => void;
    setThemeColor: (colorClass: string) => void;
}
const defaultSettings: Settings = {
    wallpaper: WALLPAPERS[0],
    themeColor: THEME_COLORS[0].class,
};
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem('desktop-settings');
            return saved ? JSON.parse(saved) : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('desktop-settings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }, [settings]);

    const setWallpaper = (url: string) => setSettings(s => ({ ...s, wallpaper: url }));
    const setThemeColor = (colorClass: string) => setSettings(s => ({ ...s, themeColor: colorClass }));

    return (
        <SettingsContext.Provider value={{ ...settings, setWallpaper, setThemeColor }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};


// --- App Data Context ---
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface AppContextType {
    data: AppData;
    loading: boolean;
    refreshData: () => Promise<void>;
    showNotification: (message: string, type: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [data, setData] = useState<AppData>({
        contasPagar: [],
        fluxoCaixa: [],
        faturamentoComNF: [],
        faturamentoSemNF: [],
    });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);
    
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [contasPagar, fluxoCaixa, faturamentoComNF, faturamentoSemNF] = await Promise.all([
                getAllContasPagar(),
                getAllFluxoCaixa(),
                getAllFaturamentoComNF(),
                getAllFaturamentoSemNF(),
            ]);
            setData({ contasPagar, fluxoCaixa, faturamentoComNF, faturamentoSemNF });
        } catch (error) {
            console.error("Failed to fetch data:", error);
            showNotification("Erro ao carregar os dados. Verifique sua conexão.", 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <AppContext.Provider value={{ data, loading, refreshData, showNotification }}>
            {children}
            <div className="fixed bottom-14 right-4 z-[100] w-full max-w-xs space-y-3">
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`glass-pane-light flex items-center gap-3 p-4 rounded-lg shadow-lg text-white font-semibold animate-fade-in-up ${n.type === 'success' ? 'bg-green-500/30 border-green-500/50' : 'bg-red-500/30 border-red-500/50'}`}
                    >
                        {n.type === 'success' ? <CheckCircleIcon className="h-6 w-6 text-green-400" /> : <ExclamationCircleIcon className="h-6 w-6 text-red-400" />}
                        <span>{n.message}</span>
                    </div>
                ))}
            </div>
        </AppContext.Provider>
    );
};

export const useAppData = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppProvider');
    }
    return context;
};


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('isAuthenticated'));
    const [user, setUser] = useState<any>(null);

    const handleLogin = (userData: any) => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return <Desktop onLogout={handleLogout} user={user} />;
}

export default App;