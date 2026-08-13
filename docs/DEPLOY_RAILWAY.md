# Deploy no Railway

O sistema (backend NestJS + frontend React) sobe como **um único serviço
Railway**: a imagem Docker (`Dockerfile` na raiz do repositório) gera o build
do frontend e do backend e empacota os dois juntos — o Nest serve a API em
`/api/*` e os arquivos estáticos do frontend em todo o resto, com fallback de
SPA para rotas do React Router (ver `backend/src/main.ts`). Isso evita CORS e
a necessidade de um segundo serviço só para o frontend.

Além desse serviço, você precisa de um banco **Postgres** — o próprio Railway
oferece isso como plugin.

## Passo a passo

### 1. Criar o projeto e o banco

1. No [Railway](https://railway.app), crie um novo projeto.
2. Adicione um serviço **PostgreSQL** (botão "+ New" → "Database" →
   "Add PostgreSQL"). O Railway cria automaticamente a variável
   `DATABASE_URL` nesse serviço.

### 2. Criar o serviço da aplicação

1. "+ New" → "GitHub Repo" → selecione `alvesjesse10-hub/awesome-system`.
2. Em **Settings** do serviço:
   - **Root Directory**: `/` (raiz do repositório — onde está o `Dockerfile`).
   - **Builder**: Railway detecta o `Dockerfile` automaticamente (o
     `railway.toml` na raiz já força isso e configura o healthcheck em
     `/api/health`).

### 3. Variáveis de ambiente do serviço da aplicação

Em **Variables**, configure:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência ao serviço Postgres — o Railway autocompleta ao digitar `${{`) |
| `JWT_SECRET` | uma string aleatória longa (ex.: gere com `openssl rand -base64 48`) — **obrigatório**, o valor padrão do código é só para desenvolvimento |
| `JWT_EXPIRES_IN` | opcional, padrão `8h` |

Não defina `PORT` manualmente — o Railway injeta essa variável automaticamente
e o backend já lê `process.env.PORT`.

### 4. Aplicar o schema e popular os dados iniciais

O container já roda `prisma migrate deploy` automaticamente a cada start (ver
`CMD` no `Dockerfile`), então o schema fica sempre atualizado. Falta rodar o
seed **uma vez**, manualmente, após o primeiro deploy:

```bash
# Instale a Railway CLI se ainda não tiver: https://docs.railway.com/guides/cli
railway login
railway link   # selecione o projeto/serviço da aplicação
railway run npm run prisma:seed --prefix backend
```

Isso cria o plano de contas padrão, a tabela do Simples Nacional, as 3
empresas (Ambiens, Smart, IGH) e o usuário admin:
`admin@ambiens.com.br` / `TrocarSenha123!` (troque a senha no primeiro
acesso).

Para importar os dados históricos reais da planilha, veja
`docs/IMPORTACAO_PLANILHA.md` — rode o script localmente apontando
`DATABASE_URL` para o Postgres do Railway (pegue a connection string pública
em Settings → do serviço Postgres → "Public Networking"), já que o arquivo
`.xlsm` nunca deve subir para o repositório nem ser processado num ambiente
compartilhado.

### 5. Domínio público

Em **Settings** do serviço da aplicação → **Networking** → "Generate Domain".
O Railway gera uma URL `https://*.up.railway.app` — é essa a URL que você
acessa no navegador (frontend e API no mesmo domínio, já que é um serviço
só). Um domínio próprio pode ser configurado na mesma tela.

## Verificando o deploy

- `https://SEU-DOMINIO/api/health` deve responder `{"status":"ok"}`.
- `https://SEU-DOMINIO/login` deve carregar a tela de login.
- Login com o usuário admin acima deve funcionar e navegar pelo sistema
  normalmente.

## Notas

- O healthcheck do Railway (`railway.toml`) bate em `/api/health`, que é
  público (não exige token) — necessário para o Railway conseguir validar
  que o deploy subiu com sucesso antes de rotear tráfego para ele.
- A imagem roda `prisma migrate deploy` a cada boot — seguro mesmo com o
  serviço reiniciando várias vezes, já que `migrate deploy` só aplica
  migrations pendentes (é idempotente).
- Se quiser separar frontend e backend em dois serviços Railway distintos no
  futuro (ex.: para escalar cada um independentemente), o backend precisaria
  de `app.enableCors({ origin: 'https://dominio-do-frontend' })` restrito (hoje
  está aberto via `app.enableCors()` porque tudo roda no mesmo domínio) e o
  frontend precisaria de uma variável de build (`VITE_API_URL`) para apontar
  `apiClient` para o domínio da API em vez da baseURL relativa `/api` — nenhuma
  dessas mudanças existe hoje porque a arquitetura combinada não precisa delas.
