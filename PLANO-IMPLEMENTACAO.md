# Plano de implementação: segurança, login com senha e redesign da plataforma Valle

Data: 05/10/2026, revisado em 09/10/2026
Repositórios: `valle-invest-front` (front Angular 19) e `valle-invest-api` (NestJS 10 + Firestore). São cópias dos repositórios originais `valle-consultoria` e `valle-api`, feitas em 08/10/2026; os originais foram descontinuados e qualquer referência a eles em documentos antigos corresponde aos novos nomes.
Base: diagnóstico do código feito em 05/10/2026 e a apresentação `Proposta-Redesign-Valle.pptx` (setembro/2026)

## Documentos relacionados

| Documento | O que é |
|---|---|
| [docs/redesign/DIAGNOSTICO-2026-09-26.md](docs/redesign/DIAGNOSTICO-2026-09-26.md) | Diagnóstico original de UX e a direção em 7 passos que deu origem à proposta. Tem a tabela que mapeia cada passo para as fases deste plano. |
| `../Proposta-Redesign-Valle.pptx` | Apresentação de 16 slides para os decisores, fora do repositório, na pasta que contém os dois repositórios. |
| [docs/redesign/tools/](docs/redesign/tools/README.md) | API simulada e script de captura de telas para rodar o front sem Firebase e comparar antes e depois de cada migração. |

---

## 1. Decisões já tomadas

| Decisão | Justificativa |
|---|---|
| Evoluir o front Angular atual, não recomeçar | Os cálculos estão todos na API. O front é uma casca de 7 telas ativas sem lógica de negócio relevante. Recomeçar refaria rotas, guards e layouts sem ganho. |
| A API é mantida e corrigida, não reescrita | `performance.service.ts` (654 linhas), `fund-operations.service.ts` (646) e `client-transactions.service.ts` (371) concentram o valor do sistema: rateio, reprocessamento e benchmarks. |
| Login por senha substitui o magic link | Pedido do produto. O magic link pode ficar ativo durante uma janela de transição (ver decisões pendentes). |
| Segurança da API vem antes de qualquer tela nova | Hoje qualquer pessoa cria um usuário admin pelo endpoint de registro e lê dados de qualquer cliente. |
| Migração visual tela a tela, sobre uma camada de componentes base criada primeiro | Não existe design system hoje. Todo estilo está inline nos templates (1.113 atributos `class`, 1.254 usos de `slate-*`, 91 usos dos tokens da marca). |

---

## 2. Estado atual verificado

### 2.1 Front (`valle-invest-front`)

- Angular 19, Tailwind v4, ApexCharts, ~6.500 linhas em `src/`. `ng-apexcharts` fixado em `1.15.0` exato (09/10/2026): as versões 1.16+ exigem Angular 20 e quebravam o `npm install` da Vercel.
- Bloco `firebase` em `src/environments/environment.ts` e `environment.prod.ts` e dependência `firebase@^12` no `package.json` sem nenhum uso em `src/`. Só expõem `apiKey`, `projectId` e `appId` no bundle público e no histórico do git.
- Telas ativas: admin (Dashboard, Visão do Cliente, Usuários, Operações do Fundo, Aportes e Resgates), cliente (Meu Painel, Extrato Financeiro, Relação de Operações com dados fixos), públicas (Login, Verificação do link).
- Código morto (sem rota ou com rota comentada): `landing`, `manage-client`, `users`, `assets`, `instruments`, `daily-results`, `operacoes`, e `client/operations` (roteado, mas com dados fixos de 2024 e fora do menu).
- Componentes compartilhados: só `asset-form`, `user-form` e `theme-toggle`. Nenhum botão, card, tabela, input ou drawer reutilizável.
- Dois `AuthService` distintos: `src/app/security/auth.service.ts` (usado pelos guards e pelo login, 7 imports) e `src/app/services/auth.service.ts` (mantém `currentUser$`, 3 imports). Apontam para endpoints diferentes.
- Nenhum interceptor HTTP. Nenhuma requisição envia `Authorization`.
- `index.html` com `lang="en"`, sem fontes carregadas. `tailwind.config.js` em formato v3 não é lido pelo Tailwind v4 sem `@config`; os tokens válidos são os do `@theme` em `styles.css`.
- `ThemeToggleComponent` renderizado em `app.component.html` como botão flutuante global. No desktop ele cobre o botão "Próximo" da paginação.
- ~50 ocorrências de pt-PT (`utilizador`, `registar`, `a carregar`, `enviámos`, `gira o acesso`). O header do cliente mostra o papel cru, "Client", em inglês.
- Rótulos errados nas telas: o gráfico do painel chama-se "Evolução do Patrimônio" mas mostra rentabilidade em %; a tabela mensal diz "Fundo vs CDI" mas inclui Ibovespa. Detalhes de UX no [diagnóstico de 26/09](docs/redesign/DIAGNOSTICO-2026-09-26.md).
- Testes: 22 dos 26 specs são scaffold padrão.

### 2.2 API (`valle-invest-api`)

- Único controller protegido: `/users`. Abertos: `/clients`, `/performance`, `/client-transactions`, `/fund-operations`, `/instruments`, `/auth/register`. Nenhum `APP_GUARD` global.
- `POST /auth/register` aceita `role` no body com valores `admin` ou `client`.
- `UpdateClientDto` herda de `CreateClientDto` via `PartialType`: `PATCH /clients/:id` aceita alterar `role`, `email` e `totalInvestido`.
- `ValidationPipe` sem `whitelist`.
- JWT com `expiresIn: '1d'` e secret default `DEFAULT_SECRET_KEY_CHANGE_ME` quando `JWT_SECRET` falta.
- Sem campo de senha no documento `users`. Sem bcrypt/argon2.
- Email pelo Resend (feito em 09/10/2026; o Nodemailer com Gmail foi removido). Chave em `RESEND_API_KEY`, remetente em `MAIL_FROM` com default `onboarding@resend.dev`, que só entrega para o email da conta Resend. Tokens de login na coleção `loginTokens` com expiração de 15 min.
- Variáveis de ambiente usadas: `FIREBASE_CREDENTIALS_BASE64`, `JWT_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `FRONTEND_URL`, `FRONTEND_URLS`, `PORT`. Não existe `.env.example`.
- Nenhum arquivo de regras do Firestore versionado (`firestore.rules`, `firebase.json`). Estado das regras desconhecido; só a API acessa o banco, via Admin SDK.
- Deploy na Vercel (`vercel.json` com `@vercel/node`).
- `UsersService` e `ClientsService` operam na mesma coleção `users`.
- Rendimentos já guardam `operationId` apontando para a operação do fundo que os gerou.
- Períodos aceitos em `/performance`: `Mês`, `6 meses`, `Desde o início`; qualquer outro valor cai em 12 meses.
- `GET /client-transactions` filtra por `startDate`, `endDate`, `clientId`. Não filtra por `status`.
- `POST /fund-operations` recebe `resultado` pronto do formulário (default 0); não calcula `valorVenda - valorInvestido`.
- Testes: 1 spec com teste real.

### 2.3 Bugs confirmados no código

| # | Bug | Onde | Efeito |
|---|---|---|---|
| B1 | Login redireciona cliente logado para `/client/dashboard`; a rota real é `/sistema/dashboard`. **Corrigido na Fase 1** (`guestGuard` + `AuthService.homeFor`) | `pages/public/login/login.component.ts:37` | Cliente já logado cai na rota curinga e volta para `/` |
| B2 | Botão de pendências no dashboard admin navega para `/admin/operacoes`, rota inexistente. **Corrigido na Fase 4** | `pages/private/admin/dashboard/dashboard.component.ts:298` | Link morto na ação principal do admin |
| B3 | Saldo do extrato invertido: API devolve desc, componente inverte para asc e começa o saldo no total atual. **Corrigido na Fase 3**: a API devolve `saldoApos` | `pages/private/client/statement/statement.component.ts:149-168` | Lançamento mais antigo mostra o saldo de hoje; o mais recente, o menor |
| B4 | Admin na Visão do Cliente vê os botões Solicitar Aporte/Resgate e a solicitação sai com `clientId` do admin. **Corrigido nas Fases 0 e 3** | `pages/private/client/dashboard/dashboard.component.ts:179-202, 488-506` | Pedido criado em nome errado |
| B5 | Aprovação faz `PATCH /clients/:id` com `totalInvestido` em paralelo ao `PATCH` da transação; a API já recalcula o saldo em transação Firestore | `pages/private/admin/client-transactions/client-transactions.component.ts:631-651` | Redundante e com corrida: pode sobrescrever o saldo calculado pela API |
| B6 | Dois `AuthService` com estado duplicado. **Corrigido na Fase 1**: serviço único em `src/app/core/auth/`, os dois arquivos antigos viraram re-exports | `src/app/security/` e `src/app/services/` | Sessão inconsistente entre telas |
| B7 | API sem guard em quase todos os endpoints; registro público com escolha de role | `valle-invest-api/src/*/*.controller.ts`, `auth.controller.ts:15` | Qualquer pessoa cria admin e lê dados de todos |
| B8 | `PATCH /clients/:id` aceita `role` e `totalInvestido` | `valle-invest-api/src/clients/dto/update-client.dto.ts` | Escalada de privilégio e corrupção de saldo |
| B9 (corrigido na Fase 1.5) | Rateio e reprocessamento calculam o saldo de cada cliente com todas as transações aprovadas, sem cortar pela data da operação | `valle-invest-api/src/fund-operations/fund-operations.service.ts` (`distributeResultInTransaction` e `reprocessOperationsFrom`) | Cliente cadastrado depois de uma operação recebe parte do resultado dela e a rentabilidade dos clientes antigos é reescrita. Detalhes na Fase 1.5 |
| B10 (corrigido na Fase 1.5) | Rentabilidade mensal do cliente usa `lucro / (saldo anterior + aportes do mês)` | `valle-invest-api/src/performance/performance.service.ts:481-488` | Aporte no fim do mês dilui o ganho de uma operação do começo do mês |
| B11 | Configuração do Firebase (`apiKey`, `projectId`, `appId`) exposta no bundle do front e no git, sem uso | `valle-invest-front/src/environments/*.ts`, `package.json` | Se as regras do Firestore forem permissivas, acesso direto ao banco sem passar pela API |

---

## 3. Ordem de execução e por quê

```
Fase 0  Segurança da API ───────┐
Fase 1  Login com senha ────────┤  API + telas públicas do front
Fase 1.5 Motor de rateio e rentabilidade (só API)
                                │
Fase 2  Fundação do design system (front, pode rodar em paralelo às fases 0, 1 e 1.5)
Fase 3  Área do cliente
Fase 4  Área do admin
Fase 5  Correções finais, limpeza e QA
```

- Fase 0 fecha a exposição atual e não depende de nada visual.
- Fase 1 depende da Fase 0 (guard global e decorator de rota pública).
- Fase 1.5 só toca a API e pode rodar em paralelo à Fase 2. Precisa terminar antes da Fase 3, porque o painel novo do cliente vai expor os números corrigidos.
- Fase 2 pode começar junto com as fases 0, 1 e 1.5, porque não toca a API.
- Fases 3 e 4 dependem da Fase 2. A ordem entre elas é uma decisão pendente (ver seção 12); o plano assume cliente primeiro.
- Bugs B1 a B6 são corrigidos na fase em que a tela afetada é migrada, não no final.

---

## 4. Fase 0: Segurança da API

**Status (09/10/2026): código implementado nos dois repositórios, sem commit.** Itens 1 a 12 feitos. As regras do Firestore já estavam publicadas como `allow read, write: if false` (conferido no console em 09/10/2026), então a chave web exposta nunca deu acesso ao banco; o arquivo `firestore.rules` versionado é idêntico ao publicado. Histórico dos dois repositórios conferido em 09/10/2026: a service account nunca foi commitada (item 14 concluído). Pendente de ação manual: excluir ou restringir a chave web no Google Cloud (item 13). Também pendente: configurar `RESEND_API_KEY` e `JWT_SECRET` com 32+ caracteres na Vercel antes do deploy, porque a API agora recusa subir sem eles.

Objetivo: nenhum endpoint responde sem token válido, exceto os de autenticação. Cliente só acessa os próprios dados. Nenhum campo derivado é aceito do cliente.

### 4.1 Tarefas na API

1. **Guard global JWT.** Registrar `JwtAuthGuard` como `APP_GUARD` em `app.module.ts`. Criar decorator `@Public()` (metadata via `Reflector`) e fazer o guard liberar rotas marcadas. Marcar como públicas: `GET /` (health), `POST /auth/request-link`, `POST /auth/verify-token` e, na Fase 1, os endpoints de login e senha.
2. **Guard de papel.** Criar `RolesGuard` + decorator `@Roles('admin')`. Aplicar `@Roles('admin')` em: `POST/PATCH/DELETE /clients`, `GET /clients` (lista), todo `/fund-operations`, todo `/instruments`, todo `/users`, `POST /client-transactions` (criação já aprovada), `PATCH/DELETE /client-transactions/:id`, `GET /client-transactions/pending/count`, `GET /performance/admin/summary`.
3. **Ownership para cliente.** Em `GET /clients/:id`, `GET /performance/:clientId` e `GET /client-transactions` (com `clientId`): se `req.user.role === 'client'`, forçar `clientId = req.user.userId` e rejeitar com 403 qualquer outro. Em `POST /client-transactions/request`, ignorar `clientId`/`clientName` do body e preencher a partir do token.
4. **Remover `POST /auth/register` público.** Criação de usuário passa a ser só `POST /clients` (admin). Se o registro precisar existir para seed, mover para o `SeederModule`.
5. **DTOs.** `UpdateClientDto` passa a ser `PartialType(OmitType(CreateClientDto, ['role', 'totalInvestido', 'email']))` mais `status`. `totalInvestido` nunca é aceito de fora: é derivado das transações. Avaliar se `email` pode mudar via endpoint específico.
6. **ValidationPipe** com `whitelist: true` e `forbidNonWhitelisted: true`.
7. **Configuração obrigatória.** Falhar no boot se `JWT_SECRET` ou `FIREBASE_CREDENTIALS_BASE64` faltarem (validação de schema no `ConfigModule.forRoot`). Criar `.env.example` com todas as variáveis da seção 2.2 e documentar no README.
8. **Rate limit** em `/auth/*` com `@nestjs/throttler` (ex.: 5 req/min por IP).

### 4.2 Tarefas no front

9. **Interceptor HTTP.** Criar `authInterceptor` (funcional, `withInterceptors`) que injeta `Authorization: Bearer` e, em 401, limpa a sessão e redireciona para `/login`. Registrar em `app.config.ts`.
10. **Remover o PATCH redundante na aprovação** (B5): `processRequest` passa a enviar só `{ status }` para a transação.
11. **Tirar o Firebase do front** (B11). Remover o bloco `firebase` de `environment.ts` e `environment.prod.ts`, deixando só `production` e `apiUrl`. Remover a dependência `firebase` do `package.json` e regenerar o lock.

### 4.3 Projeto Firebase (console, sem deploy)

12. **Regras do Firestore.** Publicar regras que negam leitura e escrita a qualquer cliente (`allow read, write: if false;`). O Admin SDK usado pela API ignora as regras, então nada muda para ela. Versionar `firestore.rules` e `firebase.json` no `valle-invest-api`. É a primeira tarefa da fase, porque fecha o risco sem depender de código.
13. **Chave web exposta.** No Google Cloud Console, excluir a chave de API que está nos environments ou restringi-la por referenciador HTTP. Como está no histórico do git, tratar como comprometida: apagar do código não basta.
14. **Service account.** Verificar no histórico dos dois repositórios que o JSON da service account (`private_key`) nunca foi commitado. Se foi, rotacionar a credencial e atualizar `FIREBASE_CREDENTIALS_BASE64` na Vercel.

### 4.4 Ordem de deploy

O front precisa enviar o token antes de a API exigir. Deploy do front com interceptor (item 9) primeiro, depois a API com guard global. Como o JWT atual expira em 1 dia, usuários logados continuam funcionando sem relogar.

### 4.5 Critérios de aceite

- Chamada sem token a qualquer endpoint fora de `/auth/*` retorna 401.
- Token de cliente em `GET /clients/<outro id>` retorna 403.
- `POST /auth/register` retorna 404.
- `PATCH /clients/:id` com `role` ou `totalInvestido` no body retorna 400.
- API não sobe sem `JWT_SECRET`.
- Bundle de produção do front não contém a string `AIzaSy`.
- Leitura no Firestore pelo SDK web com a configuração antiga retorna `permission-denied`.
- Fluxo atual de magic link continua funcionando ponta a ponta.

Estimativa: 4 a 5 dias.

---

## 5. Fase 1: Login com senha

**Status (09/10/2026): código implementado nos dois repositórios, sem commit.** API: `MailModule`, `AuthTokensService` (coleção `authTokens` com SHA-256), bcrypt, DTOs, todos os endpoints da seção 5.2, convite automático em `POST /clients`, `passwordHash` fora de toda resposta, task `seed -- --task=invite-all`, 24 testes passando. Front: `AuthService` único em `core/auth` (B6 resolvido), `guestGuard`, telas de login, esqueci-senha, definir-senha e alterar-senha, redirect por papel (B1 resolvido), botão de reenvio de convite na tela de clientes, mock atualizado. Pendências: `FRONTEND_URL` em produção apontando para o front publicado; verificar domínio no Resend e definir `MAIL_FROM`; rodar `invite-all` no cutover; **nesta fase a API sobe antes do front** (as rotas novas são aditivas e o magic link continua funcionando para o front antigo, mas o front novo depende de `GET /auth/me` e `POST /auth/login`).

Objetivo: substituir o magic link por email e senha, com primeiro acesso, recuperação e troca de senha. Nenhum usuário existente tem senha, então o primeiro acesso é parte do fluxo, não exceção.

### 5.1 Modelo de dados

Documento `users` ganha:

| Campo | Tipo | Uso |
|---|---|---|
| `passwordHash` | string ou ausente | bcrypt, custo 12 |
| `passwordSetAt` | Timestamp | auditoria |
| `mustSetPassword` | boolean | `true` para todos os usuários atuais na migração e para novos convites |

Coleção `loginTokens` é renomeada (ou substituída) por `authTokens` com `{ userId, type: 'invite' | 'reset' | 'magic', expires, usedAt }`. Validade: `invite` 7 dias, `reset` 1 hora, `magic` 15 min. Token armazenado como hash SHA-256; o valor em claro só vai no email.

#### Armazenamento de senha

- A senha nunca é armazenada nem logada em claro. Só o hash, gerado com `bcrypt` (custo 12). Se o build nativo falhar no `@vercel/node`, usar `bcryptjs`, que tem a mesma API.
- `passwordHash` nunca sai em resposta da API. Criar `UserResponseDto` que omite o campo e usar em todos os retornos de `UsersService`, `ClientsService` e `AuthService.login`. Hoje `AuthService.login` devolve o documento inteiro do usuário; isso precisa mudar antes de existir hash no banco.
- Comparação sempre com `bcrypt.compare`. Resposta 401 idêntica para "usuário não existe" e "senha errada".
- Troca de senha exige a senha atual. Reset por token invalida todos os outros tokens do usuário.
- Logs da API nunca registram body de `/auth/*`. Conferir que não há `logger.log(dto)` nesses fluxos.
- Política mínima: 8 caracteres, letra e número. Validação no DTO com `class-validator`.
- Rate limit em `/auth/login`, `/auth/forgot-password` e `/auth/reset-password` (`@nestjs/throttler`).

### 5.2 Endpoints da API

| Método e rota | Público | Corpo | Resposta |
|---|---|---|---|
| `POST /auth/login` | sim | `{ email, password }` | `{ access_token, user }`; 401 genérico em qualquer falha; 403 `MUST_SET_PASSWORD` se `mustSetPassword` |
| `POST /auth/forgot-password` | sim | `{ email }` | sempre 200, envia email se o usuário existir |
| `POST /auth/reset-password` | sim | `{ token, password }` | 200; valida token `reset` ou `invite`, grava hash, zera `mustSetPassword`, invalida token |
| `POST /auth/invite/resend` | admin | `{ userId }` | reenvia convite de primeiro acesso |
| `GET /auth/me` | autenticado | | usuário atual sem `passwordHash` |
| `PATCH /auth/password` | autenticado | `{ currentPassword, newPassword }` | 200 |
| `POST /auth/request-link` e `POST /auth/verify-token` | sim | mantidos durante a transição, removidos ao final |

Regras:

- Política de senha: mínimo 8 caracteres, ao menos uma letra e um número. Validar no DTO.
- `POST /clients` (admin) passa a disparar automaticamente o email de convite com link `FRONTEND_URL/definir-senha?token=...`.
- Script de migração (`seed.ts --task=invite-all`): marca `mustSetPassword: true` em todos os usuários e envia o convite em lote. Rodar uma vez no cutover.
- `ClientResponseDto` e qualquer retorno de `users` precisam excluir `passwordHash`.
- Templates de email: extrair o HTML inline do `auth.service.ts` para um módulo `MailModule` com três templates (convite, reset, magic link), todos enviados pelo Resend já configurado. Antes do cutover, verificar o domínio da Valle no painel do Resend e definir `MAIL_FROM` com um endereço desse domínio; sem isso, o remetente de testes só entrega para a conta Resend.

### 5.3 Front

Telas públicas novas ou refeitas (já no design system da Fase 2 se ela estiver pronta; caso contrário, com os tokens mínimos):

- `/login`: email e senha, link "Esqueci minha senha". Tratar `MUST_SET_PASSWORD` com mensagem e botão para reenviar convite.
- `/esqueci-senha`: email, confirmação neutra.
- `/definir-senha?token=`: usada para primeiro acesso e para reset. Senha e confirmação.
- `/verify-login`: mantida só durante a transição.
- Área logada: "Alterar senha" dentro do Perfil (Fase 3) e do menu do admin.

Serviços:

- **Unificar os dois `AuthService`** em `src/app/core/auth/auth.service.ts` (B6): `login`, `logout`, `forgotPassword`, `resetPassword`, `changePassword`, `currentUser` como signal, `isLoggedIn`, `role`, carregado via `GET /auth/me`. Guards passam a usar este serviço.
- Corrigir o redirect pós-login para `/admin` ou `/sistema` conforme role (B1).
- Rotas públicas com guard inverso: usuário logado que acessa `/login` vai para a área dele.

### 5.4 Critérios de aceite

- Usuário existente recebe convite, define senha, loga.
- Senha errada 5 vezes seguidas bloqueia por 1 minuto (throttler).
- Reset funciona e invalida o token após uso.
- `GET /clients` nunca retorna `passwordHash`.
- Admin consegue reenviar convite pela tela de Clientes.

Estimativa: 1,5 semana (API 4 dias, front 3 dias).

---

## 5.5. Fase 1.5: Motor de rateio e rentabilidade (API)

**Status (10/10/2026): implementada na API, sem commit; backfill pendente.** Motor puro em `src/fund-operations/rateio.ts` (`balancesAsOf`, `distribute`, `replayOperations`); `FundOperationsService.reprocessOperationsFrom(startDate, changes)` é o único caminho de escrita de rendimentos e atende `create`, `update`, `remove` e `triggerReprocessingIfNecessary` numa única transação. Regra do mesmo dia (decisão final de 10/10/2026, depois de duas tentativas por data falharem): participa quem já estava na base quando a operação foi registrada. Transações de dias anteriores entram; no mesmo dia, entra quem foi aprovado antes da hora de registro da operação (`client_transactions.approvedAt` vs `fund_operations.createdAt`; documentos antigos usam o `createTime` do Firestore, então não há backfill). Função `participates` em `rateio.ts`. `triggerReprocessingIfNecessary` reprocessa operações com data igual ou posterior à transação; as do mesmo dia registradas antes dela saem iguais. Rendimentos gravam `taxa` e `operationId`; operações gravam `patrimonioBase` e `taxa`; valores em centavos com a diferença de arredondamento no maior saldo. `PerformanceService` (cliente e admin) e `getMonthlyReturns` usam o produto de `(1 + taxa)` por mês, com fallback para a fórmula antiga enquanto houver rendimento sem `taxa`. Preview usa a base na data informada. Task `npm run seed -- --task=rebuild-yields` criada (imprime saldo antes/depois por cliente). 26 testes novos cobrem os cenários da seção 5.5.2 item 7 e os critérios de aceite abaixo, inclusive o cenário do produto (A fica em 5% após o cadastro e o aporte de B). Pendente: rodar o backfill em staging e depois em produção; limpar os specs de scaffold que falham sem `FIRESTORE`.


Objetivo: o resultado de uma operação é dividido só entre quem estava investido na data dela, e a rentabilidade de um cliente depende só do histórico dele. Nenhum cadastro, aporte ou resgate posterior altera rendimentos passados.

### 5.5.1 Como o problema acontece hoje

Cenário: cliente A tem R$ 1.000, uma operação rende R$ 50 (5%). Depois disso o cliente B é cadastrado com aporte.

1. `ClientsService.create` cria o aporte de B já aprovado e chama `triggerReprocessingIfNecessary(dataDoAporte)`.
2. Essa função busca a primeira operação com `data >= dataDoAporte`. Como as datas são truncadas para meia-noite UTC em `parseDateAsUTC` e `parseLocalDate`, uma operação registrada no mesmo dia do cadastro de B é encontrada e o reprocessamento dispara a partir dela. O mesmo acontece se qualquer operação for registrada depois com data igual ou anterior ao aporte, ou se um aporte antigo for editado.
3. `reprocessOperationsFrom` apaga os rendimentos da operação e recalcula o saldo de cada cliente somando **todas** as transações aprovadas, sem filtrar pela data da operação. O aporte de B entra na base, a operação de R$ 50 passa a ser dividida entre A e B, o rendimento de A cai e a rentabilidade dele muda.
4. `distributeResultInTransaction`, usada ao registrar uma operação nova, tem o mesmo defeito: uma operação com data retroativa inclui clientes que entraram depois dela.

Dois problemas secundários no mesmo motor:

- Os rendimentos antigos são localizados por `tipo == 'Rendimento'` e `data == op.data`, não por `operationId`. Duas operações no mesmo dia se misturam.
- Em `performance.service.ts`, a rentabilidade do mês é `lucro / (saldo anterior + aportes do mês)`. Um aporte no dia 25 dilui o ganho de uma operação do dia 5 (B10). Esse cálculo não é por evento, é por mês.

### 5.5.2 Correção

1. **Saldo na data da operação.** Criar uma função única `balancesAsOf(date, transactions)` que soma, por cliente, só as transações aprovadas com `data <= date` (aportes, resgates e rendimentos de operações anteriores). `distributeResultInTransaction` e `reprocessOperationsFrom` passam a usar essa função para a base de cada operação.
2. **Reprocessamento cronológico.** `reprocessOperationsFrom(startDate)` apaga os rendimentos por `operationId` das operações afetadas, carrega aportes e resgates aprovados, e percorre as operações em ordem de data recalculando a base a cada passo com `balancesAsOf`. O `totalInvestido` final de cada cliente é o resultado da última iteração.
3. **Regra para o mesmo dia.** Decidido em 10/10/2026: desempate pela hora de registro. Comparar só datas falha nos dois sentidos (estrita zera a base quando cliente aporta e admin registra no mesmo dia; inclusiva coloca na operação um cliente criado depois dela). Por isso a transação guarda `approvedAt` e a operação `createdAt`, e no mesmo dia entra quem foi aprovado antes de a operação ser registrada (`participates` em `rateio.ts`).
4. **Taxa gravada no rendimento.** Ao distribuir, gravar em cada transação de Rendimento o campo `taxa = resultado / patrimonioBase`, além de `valor` e `operationId`. É o mesmo número para todos os clientes da operação.
5. **Rentabilidade por evento em `performance.service.ts`.** A rentabilidade mensal do cliente passa a ser o produto de `(1 + taxa)` dos rendimentos dele no mês, em vez de `lucro / (saldo + aportes)`. Isso elimina a diluição por aportes no meio do mês e torna o número independente de quando o cliente movimentou dinheiro. O gráfico e a tabela anual seguem a mesma fórmula; `rendimentoReais` continua sendo a soma dos rendimentos em R$.
6. **Backfill.** Script `seed.ts --task=rebuild-yields` que apaga todos os rendimentos e reprocessa desde a primeira operação com o motor corrigido. Rodar em staging, comparar os saldos finais com os atuais, e só então em produção. O campo `taxa` nasce nesse backfill.
7. **Testes** em `fund-operations.service.spec.ts` e `performance.service.spec.ts` cobrindo: cliente cadastrado após a operação não recebe parte dela; aporte no fim do mês não altera a rentabilidade do mês; reprocessamento após edição de aporte antigo devolve os mesmos valores que uma distribuição feita na ordem certa; duas operações no mesmo dia não se misturam.

### 5.5.3 Critérios de aceite

- No cenário da seção 5.5.1, a rentabilidade de A permanece 5% após o cadastro e o aporte de B.
- `rentabilidadePercentual` de um cliente não muda quando ele faz um aporte num mês sem operações.
- Soma dos rendimentos de uma operação é igual ao `resultado` dela, antes e depois do reprocessamento.
- Backfill em staging reproduz os saldos atuais para os clientes que nunca foram afetados por reprocessamento indevido, e corrige os demais com diferença explicada.

Estimativa: 3 a 4 dias.

---

## 6. Fase 2: Fundação do design system (front)

**Status (10/10/2026): implementada, sem commit.** Tokens semânticos com dark mode por variáveis em `src/styles.css` (aliases `sv-*` mantidos para o legado), `tailwind.config.js` removido, Inter e Playfair Display carregadas no `index.html` (`lang="pt-BR"`), guia em `src/design-system/README.md`. Componentes em `src/app/ui/`: Button, Field/Input, PageHeader, KpiCard, Badge, DataTable (lista no mobile), Pagination, Drawer, Toast, ConfirmDialog, EmptyState, Skeleton, PeriodSelector, BottomNav, AppShell e registro de ícones (`lucide-angular`). Layouts de admin e cliente passaram a usar o `AppShell`; o botão flutuante de tema saiu e o tema foi para o menu lateral. Login, esqueci-senha, definir-senha e alterar-senha já usam os componentes. Vitrine em `/dev/ui` só em desenvolvimento. Decisão de 10/10/2026: uma única família (Inter) em títulos e interface; a serif foi removida.

Objetivo: criar a camada que não existe hoje, para que as fases 3 e 4 sejam migração de telas e não redesenho ad hoc.

### 6.1 Tokens e base

1. Remover `tailwind.config.js`. Consolidar tokens no `@theme` de `styles.css` com nomes semânticos:
   `--color-primary` (#1E462E), `--color-primary-strong`, `--color-accent` (#C7A84C), `--color-surface`, `--color-surface-alt` (#F0EAD6 e tintas), `--color-text`, `--color-text-muted`, `--color-positive` (#15803D), `--color-negative` (#B91C1C), `--color-border`. Dark mode redefine os mesmos tokens sob `.dark` (o `ThemeService` já alterna a classe).
2. Fontes via Google Fonts em `index.html`: serif de títulos (Cormorant ou Playfair Display, a confirmar com o manual de marca) e Inter. Utilitário `tabular-nums` para valores financeiros.
3. `index.html`: `lang="pt-BR"`, título "Valle Consultoria".
4. Escala tipográfica e espaçamento documentados em `src/design-system/README.md`.

### 6.2 Componentes base (`src/app/ui/`)

Standalone, com `input()`/`output()` signals, sem lógica de negócio. Cada um substitui um padrão que hoje se repete inline.

| Componente | Substitui hoje | Usado em |
|---|---|---|
| `Button` (variantes primary, secondary, ghost, danger; estado loading) | ~65 botões `bg-emerald-600` e variações | todas |
| `Field` / `Input` / `Select` com label e erro | inputs repetidos em 6 formulários | login, drawers, filtros |
| `PageHeader` (título, subtítulo, slot de ações) | cabeçalho repetido em todas as telas | todas |
| `KpiCard` (label, valor, delta, variante hero) | cards de KPI do admin e do cliente | painel cliente, dashboard do admin |
| `DataTable` (colunas declarativas, slot de linha, slot mobile em lista) | 58 `<th class="px-6 py-3">` em 5 tabelas | extrato, histórico, operações, clientes |
| `Pagination` | 4 paginações copiadas | idem |
| `Drawer` (painel lateral com header, body, footer) | 4 `aside` com `translate-x-full` | registrar transação, operação, cliente |
| `Badge` (status Pendente/Aprovado/Negado, Aporte/Resgate/Rendimento, Ativo/Inativo) | spans coloridos ad hoc | tabelas e listas |
| `Toast` (serviço + container) | nada; erros hoje vão para `console.error` | todas as ações |
| `ConfirmDialog` (serviço que retorna Promise) | `window.confirm` em 3 lugares | exclusões, aprovações |
| `EmptyState` | textos soltos "Nenhuma transação encontrada" | listas |
| `Skeleton` | blocos `animate-pulse` copiados | painéis |
| `PeriodSelector` (opções Mês, 6 meses, Ano, Desde o início) | dois grupos de botões e um `select` | painel, dashboard do admin, extrato |
| `BottomNav` | nada | layout cliente mobile |
| `Icon` | 73 SVGs inline | todas |

Para ícones, usar `lucide-angular` (tree-shakeable) em vez de SVG inline.

### 6.3 Shell de layout

- `AppShell` único com sidebar, header com título da página e menu do usuário (nome, papel traduzido, tema claro/escuro, alterar senha, sair) e slot de `BottomNav`. Layouts de admin e cliente passam a configurar só os itens de menu.
- Largura máxima do conteúdo em torno de 1280px.
- Logo reduzido a 48 a 64px de altura na sidebar, sem o fundo quadrado aparente; no login, versão compacta.
- Remover o `ThemeToggleComponent` flutuante; o tema vai para o menu do usuário.

### 6.4 Convenções

- Templates em arquivo `.html` (hoje 12 componentes têm template inline em TS).
- Control flow `@if`/`@for` em todo código novo ou migrado.
- Datas: a API devolve ISO; eliminar as conversões de `_seconds`/`toDate` espalhadas no front assim que a API garantir ISO em todos os endpoints (item na Fase 5).

### 6.5 Critérios de aceite

- Página de demonstração interna `/dev/ui` (só em `development`) mostrando cada componente nos dois temas.
- Login e Definir senha (Fase 1) já renderizados com os componentes novos.
- Nenhum `slate-*`/`emerald-*` nos arquivos novos; só tokens semânticos.

Estimativa: 1,5 a 2 semanas.

---

## 7. Fase 3: Área do cliente

**Status (10/10/2026): implementada, sem commit, antes da Fase 1.5 por decisão do produto.** Painel com patrimônio herói, três KPIs compactos, seletor de período único, gráfico alternando % acumulado e R$, tabela mensal com anos em abas (primeira coluna fixa no desktop, lista por mês no mobile), banner de pendências e ações Aportar/Resgatar no cabeçalho, escondidas para o admin em `client-view` (B4 resolvido). Extrato agrupado por mês com saldo após cada lançamento vindo da API (B3 resolvido), descrição da operação nos rendimentos e exportação CSV. Páginas novas: Solicitações (`/sistema/solicitacoes`) e Perfil (`/sistema/perfil`, telefone editável). Bottom nav com Painel, Extrato, Solicitar e Perfil. `client/operations` removido. API: períodos `mes|6m|ano|inicio`, `chartData.seriesReais`, `status` e `include=operation` na listagem de transações com `saldoApos`, `phone` em `users` e `PATCH /auth/profile`. Os números exibidos seguem o cálculo atual até a Fase 1.5 entrar; nada no front precisa mudar quando ela entrar.

Objetivo: "quanto tenho e quanto rendeu" em uma tela e meia no celular.

### 7.1 Painel (`/sistema/dashboard`)

- `KpiCard` hero com patrimônio atual, variação em R$ e % no período.
- Três KPIs compactos: rentabilidade, vs CDI, vs Ibovespa. Cor só para positivo e negativo.
- Um `PeriodSelector` global para cards, gráfico e tabela.
- Gráfico alternando "% acumulado" e "R$", com título condizente com o modo exibido. Requer que a API devolva também a série de patrimônio em R$ (ver seção 9).
- Tabela mensal com anos em abas, primeira coluna fixa, lista por mês no mobile. Título "Carteira vs CDI vs Ibovespa", sem fonte mono.
- "Aportar" e "Resgatar" viram ações secundárias no `PageHeader`. Quando o usuário é admin (rota `client-view`), os botões não aparecem (B4).
- Pendências do cliente aparecem como banner discreto acima do gráfico.

### 7.2 Extrato (`/sistema/statement`)

- Agrupado por mês, com ícone por tipo de lançamento e `DataTable` em lista no mobile.
- Saldo após cada lançamento vindo da API (campo `saldoApos` em `GET /client-transactions`), eliminando o cálculo invertido do front (B3).
- Rendimento mostra a descrição da operação que o gerou (join por `operationId`, ver seção 9).
- Exportar CSV gerado no front. PDF fica como evolução posterior (decisão pendente).

### 7.3 Solicitações

- Drawer único "Solicitar aporte/resgate" acionado pelo header do Painel e pelo item "Solicitar" da `BottomNav`.
- `clientId` não é mais enviado pelo front; a API usa o token (Fase 0).
- Toast de sucesso e banner de pendência atualizado.

### 7.4 Perfil (`/sistema/perfil`)

- Nome, email, telefone (campo novo em `users`, opcional), tema, alterar senha, sair.

### 7.5 Mobile

- `BottomNav` com Painel, Extrato, Solicitar. Sidebar escondida abaixo de `lg`.
- KPIs em duas colunas. Tabela vira lista por mês.

### 7.6 Limpeza

- Remover `client/operations` (dados fixos de 2024) e a rota `/sistema/operations`.

### 7.7 Critérios de aceite

- Painel cabe em uma tela e meia em 390px de largura sem scroll horizontal.
- Extrato mostra saldo correto no lançamento mais recente igual ao patrimônio do painel.
- Admin em `client-view` não consegue criar solicitação.
- Todas as ações têm toast de sucesso ou erro.

Estimativa: 2 a 3 semanas.

---

## 8. Fase 4: Área do admin

**Status (10/10/2026): implementada, sem commit.** Dashboard do admin com AUM, rentabilidade do período, fluxo líquido do mês e pendências, aprovação direta com confirmação e toast, últimas operações e registro pelo drawer (B2 resolvido: o link morto saiu). Clientes com busca, badges de convite e status, reenvio de convite, ativar/inativar e cadastro com aporte inicial; página de detalhe `/admin/clients/:id` reutiliza o painel do cliente embutido e concentra as ações de gestão (aporte/resgate em nome do cliente, editar nome e telefone). `client-view` virou redirect para a lista. Operações do fundo com filtros, paginação na API, resultado automático, simulação do rateio antes de salvar, alerta de data retroativa, edição e exclusão com confirmação. Aportes e resgates como inbox de pendências mais histórico com filtros, registro e edição pelo admin, exclusão com confirmação. Código morto removido: assets, daily-results, instruments, manage-client, operacoes, users, landing, asset-form, user-form, instruments.service, cdi.service e os pipes. API: `kpis.fluxoLiquidoMes` e `kpis.pendentes` no resumo, `limit` na listagem de transações, `POST /fund-operations/preview`, resultado automático no create e cache de 6 h para CDI e Ibovespa. Nenhum `*ngIf`, SVG inline ou `slate-*` sobrou em `src/app`.

Objetivo: o trabalho do dia em uma tela, sem números repetidos entre páginas.

### 8.1 Dashboard do admin (`/admin/dashboard`)

- Quatro KPIs: AUM, rentabilidade do período, fluxo líquido do mês, pendências.
- Lista de pendências com Aprovar/Negar direto, com `ConfirmDialog` e toast.
- Últimas operações do fundo com botão "Registrar" que abre o drawer da seção 8.3.
- Remove o link morto `navegarParaOperacoes` (B2).

### 8.2 Clientes (`/admin/clients` e `/admin/clients/:id`)

- Lista com busca, status, saldo e ação "Reenviar convite".
- Página de detalhe reutilizando o componente do Painel do cliente com `clientId` como input, mais um bloco de gestão: registrar aporte ou resgate em nome do cliente, ativar/inativar, editar dados de contato.
- O item de menu "Visão do Cliente" sai; o detalhe do cliente o substitui.

### 8.3 Operações do fundo (`/admin/fund-operations`)

- Drawer com `resultado` calculado como `valorVenda - valorInvestido` quando ambos preenchidos, editável.
- Antes de salvar, chamar `POST /fund-operations/preview` e mostrar "distribui R$ X entre N clientes" com a lista por cliente.
- Alerta quando a data da operação é retroativa (vai disparar reprocessamento).

### 8.4 Aportes e resgates (`/admin/client-transactions`)

- Inbox de pendentes primeiro, histórico com filtros depois.
- Aprovação só muda `status` (B5 já corrigido na Fase 0).
- Filtro por `status` via API (ver seção 9).

### 8.5 Limpeza

- Remover `manage-client`, `users`, `assets`, `instruments`, `daily-results`, `operacoes`, `landing`, `asset-form` e `user-form` se não forem reaproveitados.

### 8.6 Critérios de aceite

- Nenhum KPI aparece em mais de uma página.
- Aprovar uma pendência no dashboard atualiza o saldo do cliente conforme o recálculo da API, sem PATCH no cliente.
- Preview do rateio bate com a distribuição efetivamente gravada.

Estimativa: 2 semanas.

---

## 9. Mudanças na API para o redesign

| Tela | Necessidade | Mudança |
|---|---|---|
| Painel cliente | Série de patrimônio em R$ para alternar o gráfico | `GET /performance/:clientId` passa a incluir `chartData.seriesReais` |
| Painel e dashboard do admin | Períodos consistentes | Aceitar enum `mes`, `6m`, `ano`, `inicio` além das strings atuais; o front envia o enum |
| Extrato | Saldo após cada lançamento | `GET /client-transactions` com `clientId` devolve `saldoApos` calculado em ordem cronológica |
| Extrato | Descrição da operação em rendimentos | `GET /client-transactions` com `include=operation` anexa `operation: { id, descricao, data }` via `operationId` |
| Dashboard do admin | Fluxo líquido do mês | `GET /performance/admin/summary` ganha `kpis.fluxoLiquidoMes` (aportes menos resgates aprovados no mês corrente) |
| Dashboard do admin e inbox | Listar pendentes | `FindAllTransactionsDto` ganha `status` e `limit` |
| Operações | Preview do rateio | `POST /fund-operations/preview { resultado, data }` executa a mesma lógica de `distributeResultInTransaction` sem escrever, com a base calculada na `data` informada (Fase 1.5), e devolve `[{ clientId, name, saldo, lucro, novoSaldo }]`, `patrimonioBase` e `taxa` |
| Painel e extrato | Rentabilidade por evento | Transações de Rendimento ganham o campo `taxa` (Fase 1.5); `GET /performance/:clientId` passa a calcular a partir dele |
| Operações | Resultado automático | `CreateFundOperationDto`: se `resultado` ausente e `valorVenda`/`valorInvestido` presentes, calcular na API |
| Perfil | Telefone | Campo `phone` opcional em `users` e no `UpdateClientDto` |
| Todas | Datas ISO | Garantir que todos os endpoints convertem `Timestamp` para ISO (`joinDate` em `/clients` hoje sai como `_seconds`) |
| Perf | Benchmarks | Cachear CDI e Ibovespa em memória por 6 horas (hoje são buscados a cada requisição) |

Índices do Firestore: a combinação `clientId + status + data` em `client_transactions` e `status + data` vão exigir índices compostos. Criar antes do deploy da Fase 4.

---

## 10. Fase 5: Correções finais, limpeza e QA

1. Varredura pt-BR: substituir `utilizador`, `registar`, `a carregar`, `a verificar`, `enviámos`, `descodificar` e revisar textos de email.
2. Remover `/auth/request-link`, `/auth/verify-token` e a tela `verify-login` ao fim da transição.
3. Unificar `UsersService` e `ClientsService` na API (mesma coleção).
4. Remover `CdiService` do front (não usado) e as conversões de `_seconds`.
5. Testes mínimos na API: `recalculateClientBalance`, `distributeResultInTransaction`, `calculateMetrics`, guards e ownership. No front: `AuthService`, interceptor, `PeriodSelector`.
6. Revisão visual em desktop (1440px) e celular (390px), claro e escuro, usando o [script de capturas](docs/redesign/tools/README.md) para comparar com as telas de 26/09.
7. Revisar `FRONTEND_URLS` do CORS para os domínios finais.
8. Atualizar o mock da API em `docs/redesign/tools/` com os endpoints novos da seção 9, para a captura de telas continuar funcionando.

Estimativa: 1 semana.

---

## 11. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Ordem de deploy entre front e API ao ativar o guard global | Front com interceptor sobe antes; API com guard depois; janela de 1 dia cobre tokens ativos |
| Usuários existentes sem senha | `mustSetPassword` + convite em lote + manter magic link por 2 semanas |
| Convites em lote saindo do remetente de testes do Resend | Verificar o domínio no Resend e definir `MAIL_FROM` antes do script de convite; testar com um usuário real primeiro |
| Regras do Firestore permissivas enquanto a chave web estiver exposta (B11) | Publicar regras que negam tudo a clientes antes de qualquer outra tarefa da Fase 0; é uma ação de console, sem deploy |
| Índices compostos faltando no Firestore | Firestore devolve o link de criação no erro; criar em staging antes |
| Reprocessamento disparado por operações retroativas durante a migração | Congelar cadastro de operações no dia do cutover |
| Histórico de rendimentos já distorcido em produção por reprocessamentos indevidos (B9) | O backfill da Fase 1.5 reconstrói todos os rendimentos; comparar saldos antes e depois em staging e avisar os clientes afetados se os números mudarem |
| Mudança de contrato de `/performance` quebrar o front antigo | Adicionar campos novos sem remover os antigos até a migração da tela |
| Yahoo Finance ou BCB fora do ar derrubando o dashboard | Cache em memória e fallback para o último valor conhecido |

---

## 12. Decisões pendentes

| Decisão | Opções | Impacto |
|---|---|---|
| Prioridade: cliente ou admin primeiro | Plano assume cliente | Inverte as fases 3 e 4 |
| Validação visual antes de codificar | Protótipo HTML ou Figma | Processo; não altera o plano técnico |
| Fonte do logo e manual de marca | A receber da Valle | Fecha a tipografia da Fase 2 |
| Transição do magic link | Desligar no cutover ou manter 2 semanas | Plano assume 2 semanas |
| Algoritmo de hash de senha | bcrypt (plano) ou argon2id | Só muda a dependência; bcrypt assumido |
| Chave web do Firebase exposta | Restringir por referenciador ou excluir | Excluir é mais simples, já que nada a usa |
| Exportar PDF do extrato | Agora ou depois | Plano deixa para depois |
| Expiração do JWT | Manter 1 dia ou adicionar refresh token | Plano mantém 1 dia |
| Telefone do cliente | Incluir no Perfil ou não | Afeta `users` e Fase 3 |

---

## 13. Cronograma estimado

Para um desenvolvedor dedicado, com a Fase 2 em paralelo às fases 0 e 1 quando houver duas pessoas.

| Fase | Duração | Entrega |
|---|---|---|
| 0. Segurança da API | 4 a 5 dias | API fechada, front com interceptor, Firebase fora do front e regras do Firestore |
| 1. Login com senha | 1,5 semana | Convite, login, reset, troca de senha |
| 1.5. Motor de rateio e rentabilidade | 3 a 4 dias | Base por data, taxa no rendimento, rentabilidade por evento, backfill, testes |
| 2. Fundação | 1,5 a 2 semanas | Tokens, componentes, shell, telas públicas no visual novo |
| 3. Cliente | 2 a 3 semanas | Painel, extrato, solicitações, perfil, mobile |
| 4. Admin | 2 semanas | Dashboard, clientes com detalhe, operações com preview, inbox |
| 5. Correções e QA | 1 semana | pt-BR, limpeza, testes, revisão visual |
| **Total** | **10 a 12 semanas** sequencial; **8 a 10** com duas pessoas | |

---

## 14. Definição de pronto por fase

- Build de produção passa (`ng build` e `nest build`) sem erros.
- Lint sem erros.
- Critérios de aceite da fase verificados manualmente em staging, desktop e celular. Capturas antes e depois de cada tela migrada geradas com `docs/redesign/tools/shots.mjs`.
- Nenhum `console.error` como único tratamento de erro no código tocado.
- Nenhuma string pt-PT no código tocado.
- README e `.env.example` atualizados quando a fase adiciona variável ou comando.
