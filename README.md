# Sistema Financeiro Central Truck Assistência

Sistema financeiro completo para gestão de contas a pagar, fluxo de caixa, faturamento e usuários. Interface desktop-like responsiva com autenticação segura.

## 🚀 Funcionalidades

- **Dashboard** com gráficos interativos de faturamento e despesas
- **Contas a Pagar** - Gerenciamento completo de contas
- **Fluxo de Caixa** - Controle de entradas e saídas
- **Faturamento** - Com e sem nota fiscal
- **Gerenciamento de Usuários** - Controle de acesso
- **Personalização** - Temas e wallpapers
- **Interface Responsiva** - Desktop, tablet e mobile

## 🛠️ Tecnologias

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS
- **Charts:** SVG Charts customizados

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- Conta no Supabase

## 🚀 Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd sistema-financeiro-central-truck-assistencia-3
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env`
   - Configure as seguintes variáveis:
     ```
     VITE_SUPABASE_URL=https://seu-projeto.supabase.co
     VITE_SUPABASE_ANON_KEY=sua-chave-anonima
     ```

4. **Execute o projeto:**
   ```bash
   npm run dev
   ```

5. **Acesse:** http://localhost:3000

## 📦 Build para Produção

```bash
npm run build
npm run preview
```

## 🔒 Segurança

- Autenticação baseada em Supabase Auth
- Chaves de API protegidas em variáveis de ambiente
- Validação de entrada nos formulários
- Proteção contra SQL injection via Supabase

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- **Desktop:** Interface completa com janelas arrastáveis
- **Tablet:** Layout adaptado com navegação touch-friendly
- **Mobile:** Interface otimizada para telas pequenas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
