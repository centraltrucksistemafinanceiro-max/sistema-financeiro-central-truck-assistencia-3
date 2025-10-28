import React from 'react';

export const CATEGORIAS_CONTAS_PAGAR = ['CONSÓRCIO', 'DESPESAS FIXAS', 'DIVERSOS', 'DOAÇÃO', 'FERRAMENTAS', 'FORNECEDOR', 'IMPOSTOS', 'PEÇAS USADAS', 'SALÁRIO', 'TERCEIRIZADO', 'TERRENO'];
export const CATEGORIAS_FLUXO_CAIXA = [...CATEGORIAS_CONTAS_PAGAR, 'TRANSPORTADORA', 'BANCO'];
export const CATEGORIAS_FATURAMENTO_SEM_NF = ['FATURAMENTO', 'RETORNO', 'INTERNO', 'GARANTIA', 'CORTESIA', 'CENTRAL TRUCK'];
export const PAGE_SIZE = 20;

export const formatCurrency = (value: number) => {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const parseCurrency = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  // Handles formats like "R$ 1.234,56"
  const cleanedValue = value
    .replace('R$', '')   // remove R$ symbol
    .trim()             // remove whitespace
    .replace(/\./g, '') // remove thousand separators
    .replace(',', '.');  // replace decimal comma with dot
  
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};


export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

export const today = () => new Date().toISOString().split('T')[0];

export const WALLPAPERS = [
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop',
];

export const THEME_COLORS = [
    { name: 'Branco', class: 'text-white', bg: 'bg-white' },
    { name: 'Azul', class: 'text-blue-400', bg: 'bg-blue-400' },
    { name: 'Verde', class: 'text-green-400', bg: 'bg-green-400' },
    { name: 'Amarelo', class: 'text-yellow-400', bg: 'bg-yellow-400' },
    { name: 'Rosa', class: 'text-pink-400', bg: 'bg-pink-400' },
    { name: 'Roxo', class: 'text-purple-400', bg: 'bg-purple-400' },
];

// Icons
const iconWrapper = (IconComponent: React.FC<{ className?: string }>) => ({ className = 'text-white' }: { className?: string }) => <IconComponent className={className} />;

export const DashboardIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4zm11-1V9a4 4 0 00-4-4h-2V3h-2v2a4 4 0 004 4v2a4 4 0 00-4 4v2h2a4 4 0 004-4z" /></svg>;
export const ContasPagarIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01M12 18v-2m0-2v-2m0-2v-2m0-2V8m0 0h.01M12 18h.01M12 6h.01M12 10h.01M12 14h.01M6 18h.01M6 10h.01M6 6h.01M18 18h.01M18 10h.01M18 6h.01M6 14h.01M18 14h.01" /></svg>;
export const FluxoCaixaIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5l-3 3m0 0l-3-3m3 3V9" /></svg>;
export const FaturamentoComNFIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
export const FaturamentoSemNFIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
export const StartMenuIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-white ${className}`} fill="currentColor" viewBox="0 0 16 16"><path d="M0 0h4.828v4.828H0V0zm6.172 0H16v4.828H6.172V0zM0 6.172h4.828V16H0V6.172zm6.172 0H16V16H6.172V6.172z"/></svg>;
export const PersonalizationIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
export const UserManagementIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
export const SpinnerIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
export const PrintIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-9a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V8z" />
    </svg>
);
// New Icons for Dashboard & Notifications
export const MoneyIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const BackIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);