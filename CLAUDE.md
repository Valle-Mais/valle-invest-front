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

Em desenvolvimento, `http://localhost:4200/dev/ui` mostra todos os componentes do design system nos dois temas. A rota não existe no build de produção.

Não há ESLint configurado; o `ng build` com TypeScript estrito é a verificação. `environment.ts` já aponta para `http://localhost:3000`.

## Arquitetura

- Angular 19 standalone, Tailwind v4, ApexCharts via `ng-apexcharts` **fixado em 1.15.0** (1.16+ exige Angular 20; não subir sem migrar o Angular). Ícones com `lucide-angular`, registrados em `src/app/ui/icon/icons.ts`.
- Design system em `src/app/ui/` (barrel `src/app/ui`), tokens em `src/styles.css`, guia em `src/design-system/README.md`. As áreas logadas usam `VlAppShellComponent`; os layouts de admin e cliente só definem os itens de menu.
- Rotas: `src/app/app.routes.ts` carrega `pages/private/admin/admin.routes.ts` (prefixo `/admin`) e `pages/private/client/client.routes.ts` (prefixo `/sistema`), ambas com `authGuard` e `roleGuard` de `src/app/security/`.
- Telas: admin (dashboard, clients, clients/:id, fund-operations, client-transactions, alterar-senha; componentes compartilhados em `pages/private/admin/shared/`), cliente (dashboard, statement, solicitacoes, perfil, alterar-senha; compartilhados em `pages/private/client/shared/`), públicas (login, esqueci-senha, definir-senha, verify-login). Não há mais código morto em `pages/`.
- Todas as telas estão no design system. O painel do cliente (`ClientDashboardComponent`) é reutilizado pelo admin na página de detalhe com `[clientId]` e `[embedded]`.
- Formatação de moeda e percentual em `src/app/shared/format.ts`; não criar outro formatador nem pipe.
- Serviços HTTP em `src/app/services/`, um por recurso da API, usando `environment.apiUrl`.
- Autenticação em `src/app/core/auth/`: `auth.service.ts` é o único serviço de sessão (login com senha, esqueci/definir senha, troca de senha, reenvio de convite, magic link de transição, `currentUser` como signal e `currentUser$` para o legado); `auth.interceptor.ts` injeta o `Bearer` e encerra a sessão em 401, exceto em `/auth/*`; `guest.guard.ts` manda usuário logado para a área dele; `password-policy.ts` espelha a política da API.
- `src/app/security/auth.service.ts` e `src/app/services/auth.service.ts` são só re-exports do serviço de `core/auth`, mantidos para o legado. Código novo importa de `core/auth`.

### Dívidas que o código novo não deve repetir
- Não criar componentes visuais fora de `src/app/ui/`; componentes de domínio ficam em `pages/.../shared/`.
- A única conversão de Timestamp restante está em `ClientsService.normalizeDates` (joinDate). Não adicionar outras; a API deve devolver ISO.

## Regras de código

- Standalone components, `inject()` e signals em código novo; control flow `@if`/`@for` em vez de `*ngIf`/`*ngFor`.
- Payloads para a API contêm só os campos do DTO correspondente. A API rejeita campo extra com 400 (`forbidNonWhitelisted`). Em especial: nunca enviar `totalInvestido`, `role`, `clientName` ou `status` em create/update; o status de uma transação muda só por `PATCH /client-transactions/:id` com `{ status }`.
- Solicitação de aporte/resgate do cliente: a API usa o `clientId` do token. O front pode enviar o próprio id, mas nunca outro. Usar `RequestDrawerComponent` em vez de criar outro formulário.
- Períodos: enviar o enum `mes | 6m | ano | inicio` (o `VlPeriodSelector` já usa). Saldo após lançamento vem de `saldoApos` da API; não recalcular no front.
- Textos em pt-BR. O legado tem pt-PT (`utilizador`, `registar`, `a carregar`); corrigir ao tocar, não deixar novo.
- Feedback de erro para o usuário, não só `console.error`.
- Cores: só tokens semânticos (`bg-surface`, `text-text-muted`, `bg-primary`, `text-positive`...), nunca a paleta padrão do Tailwind (`slate`, `emerald`) nem hex. Os aliases `sv-*` existem só para o legado. Dark mode é automático pelos tokens; não escrever `dark:` em código novo.
- UI: `vl-page-header`, `button[vl-button]`, `vl-field` + `vlInput`, `vl-data-table`, `vl-drawer`, `vl-badge`, `vl-kpi-card`, `vl-pagination`, `vl-period-selector`, `vl-empty-state`, `vl-skeleton`. Ícones: `<lucide-icon name="...">`, nunca SVG inline.
- Feedback: `ToastService` para resultado de ação e `ConfirmService.ask()` em vez de `window.confirm`. Os containers já estão no `AppComponent`.
- Uma família só: Inter. Não introduzir outra fonte nem `font-serif`. Valores financeiros levam a classe `num`.
- Marca: `vl-logo` (`icon` ou `horizontal`; `onDark` só no painel verde do login). O texto segue a cor de texto do tema. Favicon e PNGs em `public/` derivam de `favicon.svg`; ao trocar, incrementar o `?v=` no `index.html`.

## Segurança: o que nunca fazer

- Colocar chave, token ou configuração de serviço externo em `src/environments/`. Os environments têm só `production` e `apiUrl`. O bloco `firebase` foi removido de propósito; o front não fala com o Firebase.
- Guardar dado sensível além do `access_token` no `localStorage`.
- Calcular saldo ou rentabilidade no front. Tudo vem da API.
- Desabilitar o interceptor ou enviar o token para domínios fora de `environment.apiUrl`.

## QA visual

Antes e depois de migrar uma tela, gerar capturas com `docs/redesign/tools/shots.mjs` (desktop 1440px e celular 390px, claro e escuro) e comparar. O mock em `docs/redesign/tools/mock-api.mjs` precisa acompanhar endpoints novos da API.
