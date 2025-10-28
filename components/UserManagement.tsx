import React, { useState, useEffect, useCallback } from 'react';
import { useAppData } from '../App';
import { getAllUsers, addUser, updateUserPassword, deleteUser } from '../services/supabase';
import { Usuario } from '../types';
import { SpinnerIcon, UserManagementIcon } from '../constants';

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


const UserManagement: React.FC = () => {
    const { showNotification } = useAppData();
    const { isMobile } = useResponsive();
    const [users, setUsers] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error: any) {
            showNotification(`Erro ao buscar usuários: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !newUserPassword.trim()) {
            showNotification('Nome de usuário e senha são obrigatórios.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await addUser({ nome: newUsername, password: newUserPassword });
            showNotification('Usuário criado com sucesso!', 'success');
            setNewUsername('');
            setNewUserPassword('');
            await fetchUsers();
        } catch (error: any) {
             showNotification(`Erro ao criar usuário: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteUser = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            try {
                await deleteUser(id);
                showNotification('Usuário excluído com sucesso!', 'success');
                await fetchUsers();
            } catch (error: any) {
                showNotification(`Erro ao excluir usuário: ${error.message}`, 'error');
            }
        }
    };
    
    const openPasswordModal = (user: Usuario) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closePasswordModal = () => {
        setSelectedUser(null);
        setNewPassword('');
        setConfirmPassword('');
        setIsModalOpen(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        if (newPassword.length < 6) {
             showNotification('A nova senha deve ter pelo menos 6 caracteres.', 'error');
             return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('As senhas não coincidem.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await updateUserPassword(selectedUser.id, newPassword);
            showNotification('Senha alterada com sucesso!', 'success');
            closePasswordModal();
        } catch (error: any) {
            showNotification(`Erro ao alterar senha: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closePasswordModal(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);


    const commonLabelClass = "block text-xs font-medium text-slate-400 mb-1";

    return (
        <div className="text-white flex flex-col h-full gap-8 p-4">
            <div>
                <h2 className="text-xl font-bold mb-4">Criar Novo Usuário</h2>
                <form onSubmit={handleCreateUser} className="glass-pane-light grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4">
                    <div>
                        <label htmlFor="newUsername" className={commonLabelClass}>Nome de Usuário</label>
                        <input id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="input-style w-full text-sm" />
                    </div>
                    <div>
                        <label htmlFor="newUserPassword" className={commonLabelClass}>Senha</label>
                        <input id="newUserPassword" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="input-style w-full text-sm" />
                    </div>
                    <div>
                        <button type="submit" className="btn-primary w-full h-10 flex items-center justify-center" disabled={isSubmitting}>{isSubmitting ? <SpinnerIcon /> : 'Criar Usuário'}</button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Usuários Existentes</h2>
                <div className="glass-pane-light overflow-auto">
                     {isLoading ? <div className="flex justify-center items-center p-8"><SpinnerIcon className="h-8 w-8" /></div> :
                     users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                           <UserManagementIcon className="h-16 w-16 opacity-50 mb-4" />
                            <p>Nenhum usuário encontrado.</p>
                        </div>
                     ): isMobile ? (
                        <div className="p-2 space-y-2">
                         {users.map((user) => (
                             <div key={user.id} className="p-3 rounded-lg bg-slate-800/60 flex justify-between items-center">
                                 <span className="font-semibold text-white">{user.nome}</span>
                                 <div className="flex space-x-3">
                                     <button onClick={() => openPasswordModal(user)} className="text-blue-400 hover:text-blue-300 font-semibold text-sm">Alterar Senha</button>
                                     <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
                                 </div>
                             </div>
                         ))}
                        </div>
                     ) : (
                    <table className="w-full text-left text-sm">
                         <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm"><tr className="border-b-2 border-slate-700"><th className="p-3">Nome de Usuário</th><th className="p-3">Ações</th></tr></thead>
                         <tbody>
                             {users.map((user, index) => (
                                <tr key={user.id} className={`border-b border-slate-700 last:border-b-0 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/40'} hover:bg-slate-700/50`}>
                                    <td className="p-3 font-semibold">{user.nome}</td>
                                    <td className="p-3">
                                        <div className="flex space-x-4">
                                            <button onClick={() => openPasswordModal(user)} className="text-blue-400 hover:text-blue-300 font-semibold">Alterar Senha</button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400 font-semibold">Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                    )}
                </div>
            </div>

            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
                    <div className="glass-pane w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">Alterar Senha</h3>
                            <p className="text-slate-400 mb-6">Alterando senha para o usuário: <span className="font-bold text-slate-200">{selectedUser.nome}</span></p>
                            <form onSubmit={handleUpdatePassword}>
                                <div className="space-y-4">
                                     <div>
                                        <label htmlFor="newPassword" className={commonLabelClass}>Nova Senha (mín. 6 caracteres)</label>
                                        <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-style w-full" />
                                    </div>
                                     <div>
                                        <label htmlFor="confirmPassword" className={commonLabelClass}>Confirmar Nova Senha</label>
                                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-style w-full" />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 mt-8">
                                    <button type="button" onClick={closePasswordModal} className="btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn-primary flex items-center" disabled={isSubmitting}>{isSubmitting ? <SpinnerIcon /> : "Salvar Senha"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;