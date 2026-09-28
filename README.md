# Prumo

Landing page e demonstração visual de uma plataforma de prova de serviço, feita com React, Vite, Tailwind CSS e componentes no padrão shadcn/ui.

## Rodar localmente

```bash
npm install
npm run dev
```

O site funciona em modo de demonstração sem variáveis de ambiente. Para ativar o envio do formulário de demonstração ao banco, configure o Supabase conforme abaixo.

## Banco de dados Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, cole e execute `supabase/schema.sql`.
3. Copie a Project URL e a chave publicável do projeto.
4. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Reinicie o servidor local depois de alterar as variáveis.

O schema inclui empresas, perfis, clientes, ordens de serviço, evidências, solicitações de demonstração, políticas RLS e o bucket privado para arquivos de prova. No navegador, use somente a chave publicável; nunca coloque `service_role` ou outra chave secreta em uma variável `VITE_`.

## Publicar na Vercel

1. Envie este projeto para um repositório GitHub.
2. Na Vercel, escolha **Add New → Project** e importe o repositório.
3. A Vercel identifica Vite; a configuração deste projeto também define `npm run build`, `dist` e o rewrite da SPA.
4. Em **Project Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Faça o deploy. Cada novo commit enviado ao GitHub gera uma nova publicação.

Não envie `.env.local` ao GitHub. Para adicionar as credenciais localmente, use `.env.local`; no deploy, use as variáveis de ambiente da Vercel.

## Planos gratuitos

Os limites e termos mudam. Na consulta de setembro de 2026, a Vercel descreve o Hobby como uso pessoal e não comercial; confirme o plano adequado antes de usar em produção comercial. O Supabase Free é útil para protótipo e início, mas tem cotas e pode pausar projetos sem atividade por uma semana. Consulte os [termos do Hobby da Vercel](https://vercel.com/legal/terms) e os [limites atuais do Supabase](https://supabase.com/pricing).
