-- Schema para o Sistema de Controle de Ponto Digital
-- Execute estes comandos no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'funcionario',
    temp_password BOOLEAN DEFAULT FALSE,
    registros JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tentativas de login
CREATE TABLE tentativas_login (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    tentativas INTEGER DEFAULT 0,
    ultima_tentativa TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario)
);

-- Tabela de logs de segurança
CREATE TABLE logs_seguranca (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario VARCHAR(100),
    mensagem TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_tentativas_login_usuario ON tentativas_login(usuario);
CREATE INDEX idx_logs_seguranca_timestamp ON logs_seguranca(timestamp);
CREATE INDEX idx_logs_seguranca_usuario ON logs_seguranca(usuario);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tentativas_login_updated_at BEFORE UPDATE ON tentativas_login FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
