-- Inserir administrador padrão no Supabase
INSERT INTO usuarios (nome, usuario, senha, role, temp_password, registros)
VALUES ('Administrador', 'admin', 'admin', 'admin', false, '[]')
ON CONFLICT (usuario) DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM usuarios WHERE usuario = 'admin';
