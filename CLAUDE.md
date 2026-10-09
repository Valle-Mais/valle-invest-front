# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório. O plano de evolução completo está em `PLANO-IMPLEMENTACAO.md` (fases, bugs numerados, decisões pendentes); o diagnóstico de UX e as ferramentas de QA visual estão em `docs/redesign/`. Consulte o plano antes de propor mudanças estruturais, e atualize a tabela de bugs e o status das fases ao concluir algo dele.

A API correspondente é `../valle-invest-api`. Mudanças de contrato (DTOs, rotas, campos) são feitas nos dois repositórios juntas, e o deploy do front sai antes do da API quando a API passa a exigir algo novo.

## Comandos

```bash
npm install
npx ng serve                       # http://localhost:4200
npm run build                      # ng build --configuration=production
npx ng test                        # karma/jasmine (quase tudo é scaffold)
node docs/redesign/tools/mock-api.mjs   # API simulada na porta 3000, sem Firebase
node docs/redesign/tools/shots.mjs      # captura as telas com Chrome headless
```

Não há ESLint configurado; o `ng build` com TypeScript estrito é a verificação. `environment.ts` já aponta para `http://localhost:3000`.

## Arquitetura

- Angular 19 standalone, Tailwind v4 (`@theme` em `src/styles.css`; `tailwind.config.js` é ignorado pelo v4), ApexCharts via `ng-apexcharts` **fixado em 1.15.0** (1.16+ exige Angular 20; não subir sem migrar o Angular).
- Rotas: `src/app/app.routes.ts` carrega `pages/private/admin/admin.routes.ts` (prefixo `/admin`) e `pages/private/client/client.routes.ts` (prefixo `/sistema`), ambas com `authGuard` e `roleGuard` de `src/app/security/`.
- Telas ativas: admin (dashboard, client-view, clients, fund-operations, client-transactions), cliente (dashboard, statement), públicas (login, verify-login). O resto de `pages/` é código morto listado no plano; não estender, remover na fase prevista.
- Serviços HTTP em `src/app/services/`, um por recurso da API, usando `environment.apiUrl`.
- `src/app/core/auth/auth.interceptor.ts` injeta o `Bearer` do `localStorage` (`access_token`) em toda chamada para `environment.apiUrl` e encerra a sessão em 401, exceto em `/auth/*`.

### Dívidas que o código novo não deve repetir

- Existem dois `AuthService`: `src/app/security/auth.service.ts` (guards e login) e `src/app/services/auth.service.ts` (`currentUser$`). Serão unificados na Fase 1. Até lá, não criar um terceiro nem espalhar mais chamadas; preferir o de `security/` para sessão e o de `services/` para `currentUser$`.
- Estilo inline com classes Tailwind em todos os templates, sem componentes compartilhados. A Fase 2 cria `src/app/ui/` com os componentes base. Enquanto ela não existe, não criar componentes "temporários" fora dessa pasta.
- 12 componentes têm template inline no `.ts`. Código novo usa `templateUrl`.
- Conversões de `_seconds`/`toDate` espalhadas. A API vai devolver ISO; não adicionar mais conversões no front.

## Regras de código

- Standalone components, `inject()` e signals em código novo; control flow `@if`/`@for` em vez de `*ngIf`/`*ngFor`.
- Payloads para a API contêm só os campos do DTO correspondente. A API rejeita campo extra com 400 (`forbidNonWhitelisted`). Em especial: nunca enviar `totalInvestido`, `role`, `clientName` ou `status` em create/update; o status de uma transação muda só por `PATCH /client-transactions/:id` com `{ status }`.
- Solicitação de aporte/resgate do cliente: a API usa o `clientId` do token. O front pode enviar o próprio id, mas nunca outro.
- Textos em pt-BR. O legado tem pt-PT (`utilizador`, `registar`, `a carregar`); corrigir ao tocar, não deixar novo.
- Feedback de erro para o usuário, não só `console.error`. Enquanto o `Toast` da Fase 2 não existe, ao menos uma mensagem na tela.
- Cores e fontes: usar os tokens de `src/styles.css` (`sv-green`, `sv-gold`, `sv-cream`), não a paleta padrão do Tailwind (`slate`, `emerald`), em código novo.

## Segurança: o que nunca fazer

- Colocar chave, token ou configuração de serviço externo em `src/environments/`. Os environments têm só `production` e `apiUrl`. O bloco `firebase` foi removido de propósito; o front não fala com o Firebase.
- Guardar dado sensível além do `access_token` no `localStorage`.
- Calcular saldo ou rentabilidade no front. Tudo vem da API.
- Desabilitar o interceptor ou enviar o token para domínios fora de `environment.apiUrl`.

## QA visual

Antes e depois de migrar uma tela, gerar capturas com `docs/redesign/tools/shots.mjs` (desktop 1440px e celular 390px, claro e escuro) e comparar. O mock em `docs/redesign/tools/mock-api.mjs` precisa acompanhar endpoints novos da API.
