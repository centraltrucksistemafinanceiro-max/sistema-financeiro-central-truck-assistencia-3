import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppData } from '../App';
import { getFaturamentoSemNF, addFaturamentoSemNF, deleteFaturamentoSemNF, updateFaturamentoSemNF, getPrintFaturamentoSemNF, getFaturamentoSemNFTotal } from '../services/supabase';
import { CATEGORIAS_FATURAMENTO_SEM_NF, formatCurrency, formatDate, today, PAGE_SIZE, SpinnerIcon, PrintIcon, parseCurrency, FaturamentoSemNFIcon } from '../constants';
import { FaturamentoSemNF } from '../types';

const MOBILE_BREAKPOINT = 768;
const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { isMobile };
};

const FaturamentoSemNFComponent: React.FC = () => {
    const { data: globalData, showNotification, refreshData } = useAppData();
    const { isMobile } = useResponsive();
    const [items, setItems] = useState<FaturamentoSemNF[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredTotal, setFilteredTotal] = useState(0);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FaturamentoSemNF | null>(null);
    const [isCondInputFocused, setIsCondInputFocused] = useState(false);

    const STORAGE_KEY = 'faturamento_sem_nf_filters';

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (typeof s.searchTerm === 'string') setSearchTerm(s.searchTerm);
                if (typeof s.startDate === 'string') setStartDate(s.startDate);
                if (typeof s.endDate === 'string') setEndDate(s.endDate);
            }
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ searchTerm, startDate, endDate }));
        } catch {}
    }, [searchTerm, startDate, endDate]);

    const [newItem, setNewItem] = useState<Omit<FaturamentoSemNF, 'id'>>({
        data_faturamento: today(), numero_orcamento: '', valor_total: 0, 
        condicao_pagamento: '', categoria: CATEGORIAS_FATURAMENTO_SEM_NF[0],
    });

    const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);
    
    const paymentConditions = useMemo(() => {
        const seen = new Set();
        return globalData.faturamentoSemNF
            .map(f => f.condicao_pagamento?.trim())
            .filter(Boolean)
            .filter(cond => {
                const lowerCaseCond = cond.toLowerCase();
                if (seen.has(lowerCaseCond)) {
                    return false;
                }
                seen.add(lowerCaseCond);
                return true;
            }) as string[];
    }, [globalData.faturamentoSemNF]);

    const conditionSuggestions = useMemo(() => {
        const cond = newItem.condicao_pagamento;
        if (!cond) return [];
        return paymentConditions.filter(name => name.toLowerCase().includes(cond.toLowerCase()));
    }, [paymentConditions, newItem.condicao_pagamento]);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ data, count }, total] = await Promise.all([
                getFaturamentoSemNF({ page: currentPage, searchTerm: debouncedSearchTerm, startDate, endDate }),
                getFaturamentoSemNFTotal({ searchTerm: debouncedSearchTerm, startDate, endDate })
            ]);
            setItems(data || []);
            setTotalCount(count || 0);
            setFilteredTotal(total || 0);
        } catch (error: any) {
            showNotification(`Erro ao buscar dados: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, startDate, endDate, showNotification]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumber = e.target.getAttribute('type') === 'number';
        setNewItem({ ...newItem, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.valor_total <= 0) {
            showNotification('O campo "Valor" deve ser maior que zero.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const addedItem = await addFaturamentoSemNF(newItem);
            await refreshData();
            showNotification('Registro adicionado com sucesso!', 'success');
            
            setItems(prev => [addedItem, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotalCount(prev => prev + 1);

            setNewItem({ data_faturamento: today(), numero_orcamento: '', valor_total: 0, condicao_pagamento: '', categoria: CATEGORIAS_FATURAMENTO_SEM_NF[0] });
        } catch (error) {
            console.error(error);
            showNotification('Erro ao adicionar registro.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await deleteFaturamentoSemNF(id);
                await refreshData();
                showNotification('Registro excluído com sucesso!', 'success');
                await fetchData();
            } catch (error: any) {
                console.error("Delete Error:", error);
                const message = error.message || 'Erro ao excluir registro.';
                showNotification(message, 'error');
            }
        }
    };

    const handleOpenEditModal = (item: FaturamentoSemNF) => {
        setEditingItem({ ...item });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editingItem) return;
        const { name, value } = e.target;
        const isNumber = e.target.getAttribute('type') === 'number';
        setEditingItem({ ...editingItem, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        if (editingItem.valor_total <= 0) {
            showNotification('O campo "Valor" deve ser maior que zero.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { id, ...updates } = editingItem;
            const updatedItem = await updateFaturamentoSemNF(id, updates);
            await refreshData();
            showNotification('Registro atualizado com sucesso!', 'success');

            setItems(prev => prev.map(item => item.id === id ? updatedItem : item));

            handleCloseEditModal();
        } catch (error) {
            console.error(error);
            showNotification('Erro ao atualizar o registro.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isEditModalOpen) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseEditModal(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isEditModalOpen]);

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            const printData = await getPrintFaturamentoSemNF({ searchTerm: debouncedSearchTerm, startDate, endDate });

            if (!printData || printData.length === 0) {
                showNotification('Nenhum dado para imprimir com os filtros atuais.', 'error');
                return;
            }

            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const content = `
                    <html>
                        <head>
                            <title>Relatório de Faturamento sem NF</title>
                            <style>
                                body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
                                h1 { text-align: center; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f2f2f2; }
                                @media print {
                                    body { margin: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            <h1>Relatório de Faturamento sem NF</h1>
                            <p><strong>Período:</strong> ${startDate ? formatDate(startDate) : 'N/A'} a ${endDate ? formatDate(endDate) : 'N/A'}</p>
                            <p><strong>Busca:</strong> ${debouncedSearchTerm || 'Nenhuma'}</p>
                            <p><strong>Data de Emissão:</strong> ${formatDate(today())}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Nº Orçamento</th>
                                        <th>Valor</th>
                                        <th>Cond. Pagamento</th>
                                        <th>Categoria</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${printData.map(item => `
                                        <tr>
                                            <td>${formatDate(item.data_faturamento)}</td>
                                            <td>${item.numero_orcamento || ''}</td>
                                            <td>${formatCurrency(parseCurrency(item.valor_total))}</td>
                                            <td>${item.condicao_pagamento || ''}</td>
                                            <td>${item.categoria}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </body>
                    </html>
                `;
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        } catch (error: any) {
            showNotification(`Erro ao gerar relatório: ${error.message}`, 'error');
        } finally {
            setIsPrinting(false);
        }
    };


    const commonLabelClass = "block text-xs font-medium text-slate-400 mb-1";

    return (
        <div className="text-white flex flex-col h-full p-2 md:p-4 gap-4">
            <form onSubmit={handleSubmit} className="glass-pane-light grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
                <div><label htmlFor="data_faturamento" className={commonLabelClass}>Data</label><input id="data_faturamento" name="data_faturamento" value={newItem.data_faturamento} onChange={handleInputChange} type="date" className="input-style w-full text-sm" /></div>
                <div><label htmlFor="numero_orcamento" className={commonLabelClass}>Nº Orçamento</label><input id="numero_orcamento" name="numero_orcamento" value={newItem.numero_orcamento} onChange={handleInputChange} placeholder="Ex: OS1234" className="input-style w-full text-sm" /></div>
                <div><label htmlFor="valor_total" className={commonLabelClass}>Valor</label><input id="valor_total" name="valor_total" value={newItem.valor_total} onChange={handleInputChange} type="number" step="0.01" placeholder="R$ 0,00" className="input-style w-full text-sm" /></div>
                <div className="relative">
                    <label htmlFor="condicao_pagamento" className={commonLabelClass}>Condição Pagamento</label>
                    <input id="condicao_pagamento" name="condicao_pagamento" value={newItem.condicao_pagamento} onChange={handleInputChange} placeholder="Ex: PIX" className="input-style w-full text-sm" onFocus={() => setIsCondInputFocused(true)} onBlur={() => setTimeout(() => setIsCondInputFocused(false), 200)} />
                    {isCondInputFocused && conditionSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {conditionSuggestions.map(name => <li key={name} onMouseDown={() => { setNewItem({...newItem, condicao_pagamento: name}); setIsCondInputFocused(false); }} className="px-3 py-2 hover:bg-blue-600 cursor-pointer">{name}</li>)}
                        </ul>
                    )}
                </div>
                <div className="lg:col-span-1"><label htmlFor="categoria" className={commonLabelClass}>Categoria</label><select id="categoria" name="categoria" value={newItem.categoria} onChange={handleInputChange} className="input-style w-full text-sm">{CATEGORIAS_FATURAMENTO_SEM_NF.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="md:col-start-2 lg:col-start-5 flex items-end"><button type="submit" className="btn-primary w-full h-10 flex items-center justify-center" disabled={isSubmitting}>{isSubmitting ? <SpinnerIcon /> : 'Adicionar'}</button></div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2 md:p-0">
                <input type="text" placeholder="Buscar por nº orçamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style text-sm w-full" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style text-sm w-full" title="Data de início" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-style text-sm w-full" title="Data de fim" />
                <div className="flex items-stretch gap-2 w-full md:w-auto">
                    <div className="glass-pane-light p-2 px-4 rounded-lg text-center flex-grow">
                        <span className="text-xs text-slate-400 font-bold block">TOTAL FILTRADO</span>
                        <span className="text-xl font-semibold text-green-400">{formatCurrency(filteredTotal)}</span>
                    </div>
                    <button onClick={handlePrint} className="btn-secondary h-10 flex items-center justify-center gap-2" disabled={isPrinting}>
                        {isPrinting ? <SpinnerIcon /> : <PrintIcon />}
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-auto glass-pane-light">
                {isLoading ? <div className="flex justify-center items-center h-full"><SpinnerIcon className="h-8 w-8" /></div> :
                items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-slate-400">
                        <FaturamentoSemNFIcon className="h-16 w-16 opacity-50 mb-4" />
                        <h3 className="text-xl font-semibold text-white">Nenhum faturamento encontrado</h3>
                        <p className="text-sm">Tente ajustar os filtros ou adicione um novo registro.</p>
                    </div>
                ) : isMobile ? (
                    <div className="p-2 space-y-3">
                        {items.map(item => (
                            <div key={item.id} className="p-3 rounded-lg bg-slate-800/60 shadow-md" onClick={() => handleOpenEditModal(item)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="pr-2">
                                        <p className="font-bold text-white">Nº Orç.: {item.numero_orcamento || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{item.categoria}</p>
                                    </div>
                                    <span className="font-semibold text-lg whitespace-nowrap text-green-400">{formatCurrency(parseCurrency(item.valor_total))}</span>
                                </div>
                                <div className="text-xs text-slate-400 flex justify-between items-center mb-3">
                                    <span>Cond.: <strong>{item.condicao_pagamento || '-'}</strong></span>
                                    <span>{formatDate(item.data_faturamento)}</span>
                                </div>
                                <div className="flex justify-end items-center">
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm"><tr className="border-b-2 border-slate-700"><th className="p-3">Data</th><th>Nº Orçamento</th><th>Valor</th><th>Cond. Pagamento</th><th>Categoria</th><th>Ações</th></tr></thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} className={`border-b border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/40'} hover:bg-slate-700/50 cursor-pointer`} onDoubleClick={() => handleOpenEditModal(item)}>
                                <td className="p-3">{formatDate(item.data_faturamento)}</td><td>{item.numero_orcamento}</td>
                                <td>{formatCurrency(parseCurrency(item.valor_total))}</td><td>{item.condicao_pagamento}</td><td>{item.categoria}</td>
                                <td>
                                    <div className="flex space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }} className="text-blue-400 hover:text-blue-300 font-semibold">Editar</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-500 hover:text-red-400 font-semibold">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
             <div className="flex justify-between items-center p-2 bg-slate-900/80 text-xs">
                <span>{items.length} de {totalCount}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="px-2 py-1 rounded disabled:opacity-50 bg-slate-700 hover:bg-slate-600">{'<'}</button>
                    <span>{currentPage + 1} de {totalPages > 0 ? totalPages : 1}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage + 1 >= totalPages} className="px-2 py-1 rounded disabled:opacity-50 bg-slate-700 hover:bg-slate-600">{'>'}</button>
                </div>
            </div>

            {isEditModalOpen && editingItem && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
                    <div className="glass-pane w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-6">Editar Faturamento sem NF</h3>
                            <form onSubmit={handleUpdateItem}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div><label htmlFor="edit_data_faturamento" className={commonLabelClass}>Data</label><input id="edit_data_faturamento" name="data_faturamento" value={editingItem.data_faturamento.split('T')[0]} onChange={handleEditInputChange} type="date" className="input-style w-full" /></div>
                                    <div><label htmlFor="edit_numero_orcamento" className={commonLabelClass}>Nº Orçamento</label><input id="edit_numero_orcamento" name="numero_orcamento" value={editingItem.numero_orcamento || ''} onChange={handleEditInputChange} className="input-style w-full" /></div>
                                    <div><label htmlFor="edit_valor_total" className={commonLabelClass}>Valor</label><input id="edit_valor_total" name="valor_total" value={editingItem.valor_total} onChange={handleEditInputChange} type="number" step="0.01" className="input-style w-full" /></div>
                                    <div><label htmlFor="edit_condicao_pagamento" className={commonLabelClass}>Condição Pagamento</label><input id="edit_condicao_pagamento" name="condicao_pagamento" value={editingItem.condicao_pagamento || ''} onChange={handleEditInputChange} className="input-style w-full" /></div>
                                    <div className="lg:col-span-2"><label htmlFor="edit_categoria" className={commonLabelClass}>Categoria</label><select id="edit_categoria" name="categoria" value={editingItem.categoria} onChange={handleEditInputChange} className="input-style w-full">{CATEGORIAS_FATURAMENTO_SEM_NF.map(c => <option key={c}>{c}</option>)}</select></div>
                                </div>
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button type="button" onClick={handleCloseEditModal} className="btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn-primary flex items-center" disabled={isSubmitting}>{isSubmitting ? <SpinnerIcon /> : 'Salvar Alterações'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaturamentoSemNFComponent;