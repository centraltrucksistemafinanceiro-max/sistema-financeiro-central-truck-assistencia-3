import React, { useState } from 'react';
import { getUserByCredentials } from '../services/supabase';
import { SpinnerIcon } from '../constants';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validação de entrada
        const sanitizedUsername = username.trim();
        const sanitizedPassword = password.trim();

        if (!sanitizedUsername || !sanitizedPassword) {
            setError('Usuário e senha são obrigatórios.');
            setIsLoading(false);
            return;
        }

        if (sanitizedUsername.length < 3 || sanitizedPassword.length < 3) {
            setError('Usuário e senha devem ter pelo menos 3 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            const user = await getUserByCredentials(sanitizedUsername, sanitizedPassword);
            if (user) {
                onLogin(user);
            } else {
                setError('Usuário ou senha inválidos.');
            }
        } catch (err: any) {
            console.error(err);
            setError('Ocorreu um erro ao tentar fazer login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="h-screen w-screen flex items-center justify-center bg-cover bg-center"
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1920&auto=format&fit=crop')"}}
        >
            <div className="glass-pane p-8 rounded-lg shadow-2xl w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Central Truck Assistência</h1>
                    <p className="text-gray-300 mt-2">Sistema Financeiro</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                            Usuário
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-style w-full"
                            placeholder="Nome de usuário"
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-style w-full"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center h-10"
                            disabled={isLoading}
                        >
                            {isLoading ? <SpinnerIcon /> : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
