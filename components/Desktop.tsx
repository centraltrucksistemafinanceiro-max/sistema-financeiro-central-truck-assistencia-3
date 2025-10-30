import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { WindowInstance } from '../types';
import Dashboard from './Dashboard';
import ContasPagar from './ContasPagar';
import FluxoCaixa from './FluxoCaixa';
import FaturamentoComNF from './FaturamentoComNF';
import FaturamentoSemNF from './FaturamentoSemNF';
import Personalization from './Personalization';
import UserManagement from './UserManagement';
import { DashboardIcon, ContasPagarIcon, FluxoCaixaIcon, FaturamentoComNFIcon, FaturamentoSemNFIcon, StartMenuIcon, PersonalizationIcon, UserManagementIcon, BackIcon } from '../constants';
import { useSettings } from '../App';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const useResponsive = () => {
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
        const width = window.innerWidth;
        if (width < MOBILE_BREAKPOINT) return 'mobile';
        if (width < TABLET_BREAKPOINT) return 'tablet';
        return 'desktop';
    });
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < MOBILE_BREAKPOINT) setScreenSize('mobile');
            else if (width < TABLET_BREAKPOINT) setScreenSize('tablet');
            else setScreenSize('desktop');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { screenSize, isMobile: screenSize === 'mobile', isTablet: screenSize === 'tablet', isDesktop: screenSize === 'desktop' };
};


interface WindowProps {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  zIndex: number;
  initialPosition?: { x: number; y: number };
}

const WindowComponent: React.FC<WindowProps> = ({ id, title, icon: Icon, children, onClose, onFocus, zIndex, initialPosition }) => {
  const [position, setPosition] = useState(() => {
    try {
        const saved = localStorage.getItem(`window-pos-${id}`);
        return saved ? JSON.parse(saved) : (initialPosition || { x: Math.max(50, window.innerWidth / 2 - 400), y: Math.max(50, window.innerHeight / 2 - 300) });
    } catch {
        return initialPosition || { x: Math.max(50, window.innerWidth / 2 - 400), y: Math.max(50, window.innerHeight / 2 - 300) };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizePosition, setPreMaximizePosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMaximize = () => {
    if (isMaximized) {
        setPosition(preMaximizePosition);
        setIsMaximized(false);
    } else {
        setPreMaximizePosition(position);
        setIsMaximized(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized || (e.target as HTMLElement).closest('button')) return;
    if (nodeRef.current) {
        onFocus(id);
        const rect = nodeRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        // Defer starting the drag until mouse moves beyond a small threshold to avoid conflicts with double-click
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMaximized) return;
    // Start dragging only after small movement to avoid double-click flicker
    if (!isDragging && dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx > 3 || dy > 3) {
            setIsDragging(true);
        } else {
            return;
        }
    }
    if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPosition({ x: newX, y: newY });
    }
  }, [isDragging, isMaximized]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && !isMaximized && nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        localStorage.setItem(`window-pos-${id}`, JSON.stringify({ x: rect.left, y: rect.top }));
    }
    setIsDragging(false);
    dragStartPos.current = null;
  }, [isDragging, isMaximized, id]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <div
      ref={nodeRef}
      className={`absolute flex flex-col ${isMaximized ? 'w-screen h-[calc(100vh-3rem)] !top-0 !left-0 rounded-none' : 'w-[80vw] max-w-[1000px] min-w-[300px] h-[80vh] min-h-[400px] rounded-lg'} glass-pane overflow-hidden ${isMaximized ? '' : 'transition-all duration-200 ease-in-out'}`}
      style={{
        top: isMaximized ? 0 : position.y,
        left: isMaximized ? 0 : position.x,
        zIndex,
      }}
      onMouseDown={() => onFocus(id)}
    >
      <div
        className="h-8 bg-black/30 flex items-center justify-between px-2 cursor-grab"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleMaximize}
      >
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-300" />
            <span className="text-white text-sm font-semibold">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
            <button title={isMaximized ? "Restaurar" : "Maximizar"} onClick={handleMaximize} className="h-5 w-5 rounded-full bg-green-500/80 hover:bg-green-500 flex items-center justify-center text-white text-lg focus:outline-none transition-colors">
              <span className="transform scale-75">{isMaximized ? '❐' : '□'}</span>
            </button>
            <button title="Fechar" onClick={() => onClose(id)} className="h-5 w-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white font-bold text-xs focus:outline-none transition-colors">
              ✕
            </button>
        </div>
      </div>
      <div className="flex-grow p-1 overflow-auto">{children}</div>
    </div>
  );
};

const StartMenu = ({ apps, themeColor, onOpenApp, onClose }: { apps: Omit<WindowInstance, 'component'>[], themeColor: string, onOpenApp: (app: Omit<WindowInstance, 'component'>) => void, onClose: () => void }) => {
    return (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 glass-pane p-4 w-full max-w-lg z-50 animate-fade-in-up">
            <div className="grid grid-cols-4 gap-4">
                {apps.map(app => {
                    const IconComponent = app.icon;
                    return (
                        <button key={app.id} onClick={() => { onOpenApp(app); onClose(); }} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:bg-white/20 transition-colors text-center">
                            <div className="text-4xl">
                                <IconComponent className={themeColor} />
                            </div>
                            <span className="text-white text-xs mt-2 break-words">{app.title}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}


// Clock isolated to avoid re-rendering the whole Desktop every 30s
const TaskbarClock: React.FC = () => {
    const [dateTime, setDateTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);
    const formattedTime = dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = dateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
        <div className="text-white text-xs font-semibold text-center">
            <div>{formattedTime}</div>
            <div>{formattedDate}</div>
        </div>
    );
};

interface DesktopProps {
    onLogout: () => void;
    user?: any;
}

const Desktop: React.FC<DesktopProps> = ({ onLogout, user }) => {
    const { wallpaper, themeColor } = useSettings();
    const [openWindows, setOpenWindows] = useState<WindowInstance[]>([]);
    const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // dateTime moved into TaskbarClock to avoid Desktop-wide re-renders
    const [activeMobileApp, setActiveMobileApp] = useState<Omit<WindowInstance, 'component'> | null>(null);

    const { screenSize, isMobile, isTablet, isDesktop } = useResponsive();

    const DESKTOP_APPS: Omit<WindowInstance, 'component'>[] = useMemo(() => [
        { id: 'dashboard', title: 'Dashboard', icon: DashboardIcon },
        { id: 'contas_pagar', title: 'Contas a Pagar', icon: ContasPagarIcon },
        { id: 'fluxo_caixa', title: 'Fluxo de Caixa', icon: FluxoCaixaIcon },
        { id: 'faturamento_com_nf', title: 'Faturamento c/ NF', icon: FaturamentoComNFIcon },
        { id: 'faturamento_sem_nf', title: 'Faturamento s/ NF', icon: FaturamentoSemNFIcon },
    ], []);

    const START_MENU_APPS = useMemo(() => [
        ...DESKTOP_APPS,
        { id: 'personalization', title: 'Personalização', icon: PersonalizationIcon },
        { id: 'user_management', title: 'Gerenciar Usuários', icon: UserManagementIcon },
    ], [DESKTOP_APPS]);

    // Clock interval moved into TaskbarClock component

    const closeWindow = useCallback((id: string) => {
        setOpenWindows(prev => prev.filter(w => w.id !== id));
        if (focusedWindow === id) {
            setFocusedWindow(null);
        }
    }, [focusedWindow]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isMenuOpen) setIsMenuOpen(false);
                if (activeMobileApp) setActiveMobileApp(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen, activeMobileApp]);

    const getComponentForId = (id: string) => {
        switch(id) {
            case 'dashboard': return <Dashboard />;
            case 'contas_pagar': return <ContasPagar />;
            case 'fluxo_caixa': return <FluxoCaixa />;
            case 'faturamento_com_nf': return <FaturamentoComNF />;
            case 'faturamento_sem_nf': return <FaturamentoSemNF />;
            case 'personalization': return <Personalization />;
            case 'user_management': return <UserManagement />;
            default: return null;
        }
    }
    
    const openWindow = (app: Omit<WindowInstance, 'component'>) => {
        if (isMobile || isTablet) {
            setActiveMobileApp(app);
            return;
        }
        if (!openWindows.find(w => w.id === app.id)) {
            const component = getComponentForId(app.id);
            if(component){
                const newWindow = {...app, component };
                setOpenWindows(prev => [...prev, newWindow]);
                setFocusedWindow(app.id);
            }
        } else {
             focusWindow(app.id);
        }
    };

    const focusWindow = (id: string) => {
        if (focusedWindow !== id) {
            setFocusedWindow(id);
            setOpenWindows(prev => {
                const windowToMove = prev.find(w => w.id === id);
                if (!windowToMove) return prev;
                const otherWindows = prev.filter(w => w.id !== id);
                return [...otherWindows, windowToMove];
            });
        }
    };
    
    // formattedTime/date moved into TaskbarClock

    const MobileTabletView = () => (
        <div className="h-full w-full flex flex-col">
            {activeMobileApp ? (
                <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col">
                    <header className="flex items-center p-2 bg-black/30 border-b border-slate-700">
                        <button onClick={() => setActiveMobileApp(null)} className="p-2 rounded-full hover:bg-white/10">
                            <BackIcon className="h-6 w-6 text-white"/>
                        </button>
                        <h1 className="text-lg font-bold text-white ml-2">{activeMobileApp.title}</h1>
                    </header>
                    <div className="flex-grow overflow-y-auto">
                        {getComponentForId(activeMobileApp.id)}
                    </div>
                </div>
            ) : (
                <>
                    <main className="flex-grow p-4 overflow-y-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">Aplicativos</h1>
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4 md:grid-cols-6'}`}>
                        {START_MENU_APPS.map(app => {
                            const IconComponent = app.icon;
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => openWindow(app)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:bg-white/20 transition-colors text-center"
                                >
                                    <div className={`text-4xl ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                                        <IconComponent className={themeColor} />
                                    </div>
                                    <span className={`text-white mt-2 break-words w-full ${isMobile ? 'text-xs' : 'text-sm'}`}>{app.title}</span>
                                </button>
                            )
                        })}
                        </div>
                    </main>
                    <footer className="h-12 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-4 border-t border-white/10">
                        <TaskbarClock />
                        <button onClick={onLogout} title="Sair do sistema" className="text-white bg-red-600/80 hover:bg-red-600 rounded-md px-3 py-1.5 text-sm transition-colors">
                            Sair
                        </button>
                    </footer>
                </>
            )}
        </div>
    );

    const DesktopView = () => (
        <>
            <div className="flex-grow p-4 flex flex-col flex-wrap content-start gap-2">
                {DESKTOP_APPS.map(app => {
                    const IconComponent = app.icon;
                    return (
                        <button
                            key={app.id}
                            onDoubleClick={() => openWindow(app)}
                            className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:bg-white/20 transition-colors text-center w-28 h-24"
                            title={`Abrir ${app.title}`}
                        >
                            <div className="text-4xl">
                                <IconComponent className={themeColor} />
                            </div>
                            <span className="text-white text-xs mt-2 break-words w-full">{app.title}</span>
                        </button>
                    )
                })}
            </div>

            {openWindows.map((win, index) => (
                <WindowComponent
                    key={win.id}
                    id={win.id}
                    title={win.title}
                    icon={win.icon}
                    onClose={closeWindow}
                    onFocus={focusWindow}
                    zIndex={10 + index}
                    initialPosition={{
                        x: Math.max(50, 150 + index * 30),
                        y: Math.max(50, 100 + index * 30)
                    }}
                >
                    {win.component}
                </WindowComponent>
            ))}

            {isMenuOpen && <StartMenu apps={START_MENU_APPS} themeColor={themeColor} onOpenApp={openWindow} onClose={() => setIsMenuOpen(false)} />}

            {/* Taskbar */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-2 border-t border-white/10">
                 <div className="flex items-center space-x-1">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 rounded-md transition-colors ${isMenuOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                        <StartMenuIcon />
                    </button>
                    {openWindows.map(win => {
                        const IconComponent = win.icon;
                        const isFocused = focusedWindow === win.id;
                        return (
                            <button key={win.id} onClick={() => focusWindow(win.id)} 
                                className={`relative p-1 rounded-md transition-colors ${isFocused ? 'bg-white/10' : 'hover:bg-white/10'}`}
                                title={win.title}
                            >
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <IconComponent className={themeColor} />
                                </div>
                                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-white transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0'}`}></div>
                            </button>
                        )
                    })}
                </div>
                 <div className="flex items-center space-x-4">
                    <TaskbarClock />
                    <button onClick={onLogout} title="Sair do sistema" className="text-white bg-red-600/80 hover:bg-red-600 rounded-md px-3 py-1.5 text-sm transition-colors">
                        Sair
                    </button>
                 </div>
            </div>
        </>
    );

    return (
        <div
            className="h-screen w-screen bg-cover bg-center overflow-hidden flex flex-col transition-all duration-500"
            style={{backgroundImage: `url('${wallpaper}')`}}
        >
           {(isMobile || isTablet) ? <MobileTabletView /> : <DesktopView />}
        </div>
    );
};

export default Desktop;