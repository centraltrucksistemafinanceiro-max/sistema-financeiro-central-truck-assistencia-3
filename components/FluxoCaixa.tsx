import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppData } from '../App';
import { getFluxoCaixa, addFluxoCaixa, deleteFluxoCaixa, updateFluxoCaixa, getPrintFluxoCaixa, getFluxoCaixaTotal } from '../services/supabase';
import { CATEGORIAS_FLUXO_CAIXA, formatCurrency, formatDate, today, PAGE_SIZE, SpinnerIcon, PrintIcon, parseCurrency, FluxoCaixaIcon } from '../constants';
import { FluxoCaixa } from '../types';

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

const FluxoCaixaComponent: React.FC = () => {
    const { data: globalData, showNotification, refreshData } = useAppData();
    const { isMobile } = useResponsive();
    const [items, setItems] = useState<FluxoCaixa[]>([]);
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
    const [editingItem, setEditingItem] = useState<FluxoCaixa | null>(null);
    const [isDescInputFocused, setIsDescInputFocused] = useState(false);

    const STORAGE_KEY = 'fluxo_caixa_filters';

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

    const [newItem, setNewItem] = useState<Omit<FluxoCaixa, 'id'>>({
        data_movimento: today(),
        descricao: '',
        categoria: CATEGORIAS_FLUXO_CAIXA[0],
        tipo_movimento: 'SAÍDA',
        valor: 0
    });
    
    const totalPages = useMemo(() => Math.ceil(totalCount / PAGE_SIZE), [totalCount]);

    const descriptions = useMemo(() => {
        const seen = new Set();
        return globalData.fluxoCaixa
            .map(item => item.descricao.trim())
            .filter(desc => {
                const lowerCaseDesc = desc.toLowerCase();
                if (seen.has(lowerCaseDesc) || !desc) {
                    return false;
                }
                seen.add(lowerCaseDesc);
                return true;
            });
    }, [globalData.fluxoCaixa]);

    const descriptionSuggestions = useMemo(() => {
        if (!newItem.descricao) return [];
        return descriptions.filter(name => name.toLowerCase().includes(newItem.descricao.toLowerCase()));
    }, [descriptions, newItem.descricao]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [{ data, count }, total] = await Promise.all([
                getFluxoCaixa({ page: currentPage, searchTerm: debouncedSearchTerm, startDate, endDate }),
                getFluxoCaixaTotal({ searchTerm: debouncedSearchTerm, startDate, endDate })
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
        if (!newItem.descricao.trim()) {
            showNotification('O campo "Descrição" é obrigatório.', 'error');
            return;
        }
        if (newItem.valor <= 0) {
            showNotification('O campo "Valor" deve ser maior que zero.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const addedItem = await addFluxoCaixa(newItem);
            await refreshData();
            showNotification('Registro adicionado com sucesso!', 'success');
            
            setItems(prev => [addedItem, ...prev.slice(0, PAGE_SIZE - 1)]);
            setTotalCount(prev => prev + 1);

            setNewItem({ data_movimento: today(), descricao: '', categoria: CATEGORIAS_FLUXO_CAIXA[0], tipo_movimento: 'SAÍDA', valor: 0 });
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
                await deleteFluxoCaixa(id);
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

    const handleOpenEditModal = (item: FluxoCaixa) => {
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

        if (!editingItem.descricao.trim()) {
            showNotification('O campo "Descrição" é obrigatório.', 'error');
            return;
        }
        if (editingItem.valor <= 0) {
            showNotification('O campo "Valor" deve ser maior que zero.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { id, ...updates } = editingItem;
            const updatedItem = await updateFluxoCaixa(id, updates);
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
            const printData = await getPrintFluxoCaixa({ searchTerm: debouncedSearchTerm, startDate, endDate });
    
            if (!printData || printData.length === 0) {
                showNotification('Nenhum dado para imprimir com os filtros atuais.', 'error');
                return;
            }
    
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const content = `
                    <html>
                        <head>
                            <title>Relatório de Fluxo de Caixa</title>
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
                            <h1>Relatório de Fluxo de Caixa</h1>
                            <p><strong>Período:</strong> ${startDate ? formatDate(startDate) : 'N/A'} a ${endDate ? formatDate(endDate) : 'N/A'}</p>
                            <p><strong>Busca:</strong> ${debouncedSearchTerm || 'Nenhuma'}</p>
                            <p><strong>Data de Emissão:</strong> ${formatDate(today())}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Descrição</th>
                                        <th>Categoria</th>
                                        <th>Tipo</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${printData.map(item => `
                                        <tr>
                                            <td>${formatDate(item.data_movimento)}</td>
                                            <td>${item.descricao}</td>
                                            <td>${item.categoria}</td>
                                            <td>${item.tipo_movimento}</td>
                                            <td>${formatCurrency(parseCurrency(item.valor))}</td>
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
            <form onSubmit={handleSubmit} className="glass-pane-light grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4">
                <div><label htmlFor="data_movimento" className={commonLabelClass}>Data</label><input id="data_movimento" name="data_movimento" value={newItem.data_movimento} onChange={handleInputChange} type="date" className="input-style w-full text-sm" /></div>
                <div className="md:col-span-2 lg:col-span-2 relative">
                    <label htmlFor="descricao" className={commonLabelClass}>Descrição</label>
                    <input id="descricao" name="descricao" value={newItem.descricao} onChange={handleInputChange} placeholder="Ex: Pagamento de fornecedor" className="input-style w-full text-sm" onFocus={() => setIsDescInputFocused(true)} onBlur={() => setTimeout(() => setIsDescInputFocused(false), 200)} />
                    {isDescInputFocused && descriptionSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-slate-600 border border-slate-500 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {descriptionSuggestions.map(name => <li key={name} onMouseDown={() => { setNewItem({...newItem, descricao: name}); setIsDescInputFocused(false); }} className="px-3 py-2 hover:bg-blue-600 cursor-pointer">{name}</li>)}
                        </ul>
                    )}
                </div>
                <div><label htmlFor="categoria" className={commonLabelClass}>Categoria</label><select id="categoria" name="categoria" value={newItem.categoria} onChange={handleInputChange} className="input-style w-full text-sm">{CATEGORIAS_FLUXO_CAIXA.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label htmlFor="tipo_movimento" className={commonLabelClass}>Tipo</label><select id="tipo_movimento" name="tipo_movimento" value={newItem.tipo_movimento} onChange={handleInputChange} className="input-style w-full text-sm"><option>SAÍDA</option><option>ENTRADA</option></select></div>
                <div><label htmlFor="valor" className={commonLabelClass}>Valor</label><input id="valor" name="valor" value={newItem.valor} onChange={handleInputChange} type="number" step="0.01" placeholder="R$ 0,00" className="input-style w-full text-sm" /></div>
                <div className="md:col-start-2 lg:col-start-6 flex items-end"><button type="submit" className="btn-primary w-full h-10 flex items-center justify-center" disabled={isSubmitting}>{isSubmitting ? <SpinnerIcon /> : 'Adicionar'}</button></div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2 md:p-0">
                <input type="text" placeholder="Buscar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-style text-sm w-full" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style text-sm w-full" title="Data de início" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-style text-sm w-full" title="Data de fim" />
                <div className="flex items-stretch gap-2 w-full md:w-auto">
                    <div className="glass-pane-light p-2 px-4 rounded-lg text-center flex-grow">
                        <span className="text-xs text-slate-400 font-bold block">SALDO FILTRADO</span>
                        <span className="text-xl font-semibold ${filteredTotal >= 0 ? 'text-green-400' : 'text-red-400'}">{formatCurrency(filteredTotal)}</span>
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
                        <FluxoCaixaIcon className="h-16 w-16 opacity-50 mb-4" />
                        <h3 className="text-xl font-semibold text-white">Nenhum lançamento encontrado</h3>
                        <p className="text-sm">Tente ajustar os filtros ou adicione um novo registro.</p>
                    </div>
                ) : isMobile ? (
                    <div className="p-2 space-y-3">
                    {items.map(item => (
                        <div key={item.id} className={`p-3 rounded-lg bg-slate-800/60 shadow-md`} onClick={() => handleOpenEditModal(item)}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-white pr-2">{item.descricao}</span>
                                <span className={`font-semibold text-lg whitespace-nowrap ${item.tipo_movimento === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                                    {item.tipo_movimento === 'SAÍDA' && '- '}{formatCurrency(parseCurrency(item.valor))}
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 flex justify-between items-center mb-3">
                                <span>{item.categoria}</span>
                                <span>{formatDate(item.data_movimento)}</span>
                            </div>
                             <div className="flex justify-end items-center">
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm"><tr className="border-b-2 border-slate-700"><th className="p-3">Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} className={`border-b border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/40'} hover:bg-slate-700/50 cursor-pointer`} onDoubleClick={() => handleOpenEditModal(item)}>
                                <td className="p-3">{formatDate(item.data_movimento)}</td><td>{item.descricao}</td><td>{item.categoria}</td>
                                <td className={`font-semibold ${item.tipo_movimento === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>{item.tipo_movimento}</td>
                                <td className={`font-semibold ${item.tipo_movimento === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(parseCurrency(item.valor))}</td>
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
                            <h3 className="text-xl font-bold mb-6">Editar Lançamento no Caixa</h3>
                            <form onSubmit={handleUpdateItem}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div><label htmlFor="edit_data_movimento" className={commonLabelClass}>Data</label><input id="edit_data_movimento" name="data_movimento" value={editingItem.data_movimento.split('T')[0]} onChange={handleEditInputChange} type="date" className="input-style w-full" /></div>
                                    <div className="md:col-span-2"><label htmlFor="edit_descricao" className={commonLabelClass}>Descrição</label><input id="edit_descricao" name="descricao" value={editingItem.descricao} onChange={handleEditInputChange} className="input-style w-full" /></div>
                                    <div><label htmlFor="edit_categoria" className={commonLabelClass}>Categoria</label><select id="edit_categoria" name="categoria" value={editingItem.categoria} onChange={handleEditInputChange} className="input-style w-full">{CATEGORIAS_FLUXO_CAIXA.map(c => <option key={c}>{c}</option>)}</select></div>
                                    <div><label htmlFor="edit_tipo_movimento" className={commonLabelClass}>Tipo</label><select id="edit_tipo_movimento" name="tipo_movimento" value={editingItem.tipo_movimento} onChange={handleEditInputChange} className="input-style w-full"><option>SAÍDA</option><option>ENTRADA</option></select></div>
                                    <div><label htmlFor="edit_valor" className={commonLabelClass}>Valor</label><input id="edit_valor" name="valor" value={editingItem.valor} onChange={handleEditInputChange} type="number" step="0.01" className="input-style w-full" /></div>
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

export default FluxoCaixaComponent;