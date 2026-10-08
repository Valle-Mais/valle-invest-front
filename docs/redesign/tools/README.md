# Ferramentas de QA visual do redesign

Dois scripts recuperados da análise de 26/09/2026. Permitem rodar o front e capturar todas as telas sem credenciais do Firebase. Sem dependências npm: só Node 22+ e Google Chrome instalado no caminho padrão do macOS.

## mock-api.mjs

Servidor HTTP na porta 3000 que imita os endpoints da `valle-api` com dados fictícios: 1 admin, 6 clientes, transações, operações do fundo e séries de performance com CDI e Ibovespa.

Rotas servidas: `POST /auth/verify-token`, `GET /clients`, `GET /clients/:id`, `GET /client-transactions`, `GET /client-transactions/pending/count`, `GET /fund-operations`, `GET /performance/admin/summary`, `GET /performance/:clientId`.

Quando a API ganhar os endpoints novos da seção 9 do plano (login com senha, `status` na listagem, `preview` do rateio, `saldoApos`, `seriesReais`), este mock precisa acompanhar.

```bash
node docs/redesign/tools/mock-api.mjs
```

O `src/environments/environment.ts` já aponta para `http://localhost:3000`, então basta subir o mock e rodar `ng serve`.

## shots.mjs

Abre o Chrome headless via DevTools Protocol, injeta um token JWT falso no `localStorage` (admin ou cliente), e captura 14 telas em desktop (1440x900) e celular (390x844), claro e escuro, na pasta `shots/` ao lado do script.

```bash
node docs/redesign/tools/mock-api.mjs &
npx ng serve &
node docs/redesign/tools/shots.mjs
```

Uso previsto no plano: comparar antes e depois de cada tela migrada, e cumprir o item "revisão visual em desktop e celular, claro e escuro" da definição de pronto. Com o guard JWT real (Fase 0) o front continua aceitando o token falso, porque ele só é validado pela API, que aqui é o mock.

A lista de telas em `shots.mjs` precisa ser atualizada conforme rotas mudam: `/sistema/operations` sai na Fase 3, `/admin/clients/:id` e `/sistema/perfil` entram, e as telas públicas de senha entram na Fase 1.
