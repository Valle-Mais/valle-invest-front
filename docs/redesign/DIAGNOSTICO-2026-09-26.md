# Diagnóstico e direção do redesign (26/09/2026)

Origem: análise feita em 26/09/2026 a partir do código do `valle-consultoria` e do `valle-api`, hoje continuados como `valle-invest-front` e `valle-invest-api`, com o front rodando localmente sobre uma API simulada (ver [tools/README.md](tools/README.md)). Este texto deu origem à apresentação `Proposta-Redesign-Valle.pptx` e foi detalhado em tarefas no [PLANO-IMPLEMENTACAO.md](../../PLANO-IMPLEMENTACAO.md).

O plano de implementação é a referência atual. Este documento fica como registro do diagnóstico original e dos pontos de UX que o plano cita de forma resumida.

## Como este diagnóstico virou o plano

| Passo da direção proposta aqui | Onde está no plano de implementação |
|---|---|
| 1. Fundação (tokens, fontes, componentes base) | Fase 2, seções 6.1 e 6.2 |
| 2. Layout (sidebar estreita, header, menu do usuário, largura máxima) | Fase 2, seção 6.3 |
| 3. Painel do cliente | Fase 3, seção 7.1 |
| 4. Extrato | Fase 3, seção 7.2 |
| 5. Admin (cockpit, detalhe do cliente, preview do rateio, inbox) | Fase 4 |
| 6. Mobile-first para o cliente | Fase 3, seção 7.5 |
| 7. Correções junto (pt-BR, rotas mortas, AuthService, guard JWT, saldo do extrato) | Fases 0, 1 e 5 |

O que o plano acrescentou depois deste diagnóstico: login com senha substituindo o magic link (Fase 1), a gravidade real da API aberta (registro público com escolha de role, `PATCH /clients` aceitando `role` e `totalInvestido`), o duplo PATCH na aprovação de transações, e as mudanças de API necessárias para as telas novas (seção 9 do plano).

---

## O que a plataforma é hoje

É o portal de uma carteira administrada em cotas informais. O admin registra as operações do fundo (trades com resultado em R$), e a API rateia esse resultado proporcionalmente entre os clientes ativos como transações de "Rendimento". Clientes solicitam aportes e resgates, o admin aprova. Os dashboards comparam a rentabilidade acumulada (TWR) com CDI (API do Banco Central) e Ibovespa (Yahoo Finance). Login é por link mágico no e-mail, sem senha.

Stack: Angular 19 standalone + Tailwind v4 + ApexCharts no front; NestJS 10 + Firestore na Vercel na API. São apenas 7 telas reais em uso:

- Público: login e verificação do link.
- Admin: Visão Geral, Visão do Cliente (reusa o painel do cliente com um select), Usuários, Operações do Fundo, Aportes/Resgates.
- Cliente: Meu Painel e Extrato Financeiro.

Há bastante código morto no repo: landing page, "manage-client", users, assets, instruments, daily-results, operacoes e a "Relação de Operações" do cliente (dados hardcoded de 2024, sem link no menu). Isso simplifica o redesign: o escopo real é pequeno.

## Diagnóstico visual e de UX

- **Identidade da marca não chega na UI.** Os tokens verde/dourado/creme existem em `src/styles.css`, mas as telas usam verde-esmeralda, azul, roxo, índigo e amarelo do Tailwind. O logo dourado convive com um visual de template genérico. Nenhuma fonte é carregada de fato: o `tailwind.config.js` declara Inter e Lora, mas é ignorado pelo Tailwind v4, e o `index.html` não importa fonte alguma.
- **Logo desproporcional.** Ocupa toda a largura da sidebar e um bloco enorme no login, com fundo quadrado aparente. Espaço nobre desperdiçado.
- **KPIs sem hierarquia.** No painel do cliente são 5 cards iguais em grade 3+2 com um buraco, cada um com uma cor arbitrária. A cor deveria codificar só positivo/negativo, e "Saldo atual" merece ser o herói da tela.
- **Informação repetida.** O admin vê a mesma rentabilidade e o mesmo AUM em três páginas diferentes, e no próprio dashboard o número aparece duas vezes.
- **Tabela de rentabilidade mensal**, que é o conteúdo mais valioso para o cliente, está com cabeçalho escuro deslocado, fonte mono estourando a largura (OUT/NOV/DEZ cortados já em 1440px) e o título diz "Fundo vs CDI" embora tenha Ibovespa. O gráfico chama-se "Evolução do Patrimônio", mas mostra rentabilidade percentual.
- **Ações de aporte/resgate** são dois botões gigantes verde e vermelho dentro do card do gráfico. Aparecem também para o admin na Visão do Cliente, e se ele clicar a solicitação é criada em nome do próprio admin, não do cliente selecionado.
- **Feedback inexistente.** Nenhum toast; confirmações usam `window.confirm`; erros vão para o console. Loading é um spinner genérico e não há empty states desenhados.
- **Extrato com saldo invertido.** A coluna Saldo parte do total e "anda para trás" na ordem errada, então o lançamento mais recente mostra o menor saldo. Está em `src/app/pages/private/client/statement/statement.component.ts:149-168`.
- **Mobile funciona, mas é longo.** Os cards viram uma coluna interminável, os rótulos do gráfico ficam ilegíveis e o botão flutuante de tema cobre conteúdo (no desktop ele tampa o botão "Próximo" da paginação).
- **Idioma misto.** pt-PT ("Registe", "utilizador", "A carregar", "gira o acesso") misturado com pt-BR, "Client" em inglês no header, `lang="en"` e título "ValleConsultoria".

Bugs de fluxo que afetam o redesign: o login redireciona cliente já logado para `/client/dashboard`, rota que não existe (a certa é `/sistema`), gerando loop; o "Processar" do dashboard admin aponta para uma rota morta; existem dois AuthService distintos; e nos controllers da API que li nenhum endpoint usa o `JwtAuthGuard`, ou seja, um cliente autenticado consegue ler dados de outros clientes.

## Direção proposta para o redesign

Redesign incremental dentro do Angular atual, sem trocar stack: são 7 telas e a API não precisa mudar para isso. A ordem que faz sentido:

1. **Fundação.** Tokens semânticos (superfície, borda, texto, marca, positivo, negativo) com dark mode derivado deles. Verde-floresta como cor primária, dourado só como acento (item ativo, destaques), creme como superfície clara. Uma serif para títulos que converse com o logo (Cormorant ou Playfair) e uma sans para UI (Inter) com números tabulares. Componentes base: KpiCard, DataTable com primeira coluna fixa, Drawer, Badge, Toast, ConfirmDialog, EmptyState, Skeleton e um PeriodSelector único.
2. **Layout.** Sidebar mais estreita com logo compacto, header com título da página, seletor de período global e menu do usuário (o toggle de tema vai para lá). Largura máxima de conteúdo em torno de 1280px.
3. **Painel do cliente** (prioridade, é a vitrine da Valle). Patrimônio atual como herói com variação em R$ e % no período; linha compacta com Rentabilidade, vs CDI e vs Ibovespa; períodos Mês / 6M / Ano / Desde o início; gráfico com alternância "% acumulado / R$"; tabela mensal como bloco principal, com anos em abas e scroll horizontal com sombra no celular; "Aportar" e "Resgatar" como ações secundárias no header; solicitações pendentes como banner discreto.
4. **Extrato.** Agrupado por mês, ícone por tipo, saldo corrigido, rendimento mostrando a operação que o gerou (o `operationId` já existe), exportação em PDF/CSV.
5. **Admin.** Dashboard como cockpit: AUM, rentabilidade, fluxo líquido do mês, pendências com aprovação direta, últimas operações. Página de detalhe do cliente unindo "Visão do Cliente" com as ações de gestão. Em Operações do Fundo, resultado calculado automaticamente e um preview do rateio antes de salvar. Em Aportes/Resgates, a inbox de pendências vem primeiro.
6. **Mobile-first para o cliente.** Provavelmente a maioria dos acessos vem do link no e-mail no celular. Bottom nav com Painel, Extrato e Solicitar; KPIs em duas colunas; tabela mensal como lista por mês.
7. **Correções junto.** pt-BR consistente, rotas mortas removidas, AuthService unificado, guard JWT na API, saldo do extrato.

## Material pedido à Valle

Fotos com dados reais (painel do cliente no desktop e no celular, tabela de rentabilidade, tela de Aportes/Resgates do admin com pendências), manual de marca ou a fonte usada no logo. As capturas feitas nesta análise usaram dados fictícios e não mostram a densidade real.
