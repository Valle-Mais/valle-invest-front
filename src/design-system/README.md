# Design system Valle

Fundação visual do front (Fase 2 do plano). Tokens em `src/styles.css`, componentes em `src/app/ui/`, demonstração em `/dev/ui` (só em desenvolvimento).

## Princípios

1. **A marca guia a interface.** Verde-floresta como cor primária, dourado só como acento (item ativo, destaques), creme como superfície alternativa. Uma única família tipográfica, Inter, em títulos e interface.
2. **Um número herói por tela.** `KpiCard` com `hero` para o valor principal; os demais compactos. Cor só para positivo e negativo.
3. **Feedback em toda ação.** `ToastService` para resultado, `ConfirmService` em vez de `window.confirm`, `EmptyState` e `Skeleton` para listas.
4. **Mobile-first para o cliente.** `BottomNav`, `DataTable` vira lista em telas pequenas, KPIs em duas colunas.

## Marca

`VlLogoComponent` (`vl-logo`): lockup compacto Valle+Invest, com o símbolo de investimentos (linha ascendente) num círculo dourado e a palavra "Valle+Invest" em Inter, na cor do texto do tema. `variant` `icon` ou `horizontal`, `size` em px (28 no header, 40 no login), `onDark` para fundo verde. O favicon é `public/favicon.svg`: o mesmo círculo dourado com o símbolo, em fundo transparente; os PNGs de Android e iOS levam fundo verde. Os PNGs em `public/` (favicon 16/32, `favicon.ico`, apple-touch 180, android-chrome 192/512) são gerados a partir dele; para regenerar, renderizar o SVG a 512px e reduzir. Os links no `index.html` levam `?v=N`; ao trocar o ícone, incrementar para furar o cache do navegador.

## Tokens

Definidos como variáveis CSS em `:root` e `.dark`, expostos como utilitários pelo `@theme inline`. Usar sempre o nome semântico, nunca o hex nem a paleta padrão do Tailwind.

| Utilitário | Uso |
|---|---|
| `bg-primary`, `text-on-primary`, `hover:bg-primary-strong` | Botão primário, navegação ativa |
| `bg-primary-soft`, `text-primary` | Fundos suaves de destaque, links |
| `bg-accent`, `text-accent`, `bg-accent-soft` | Acento dourado: item ativo, badges de destaque |
| `bg-surface` | Fundo da página |
| `bg-surface-raised` | Cards, drawers, tabelas |
| `bg-surface-alt` | Seções em creme, cabeçalhos de tabela |
| `text-text`, `text-text-muted` | Texto principal e secundário |
| `border-border` | Toda borda |
| `text-positive`, `bg-positive-soft` | Ganhos, aprovações, sucesso |
| `text-negative`, `bg-negative-soft` | Perdas, resgates, erros |
| `text-warning`, `bg-warning-soft` | Pendências, atenção |
| `text-info`, `bg-info-soft` | Informação neutra |
| `ring-ring` | Foco (já aplicado globalmente em `:focus-visible`) |

Os aliases `sv-green`, `sv-gold` e `sv-cream` continuam existindo para o legado e apontam para os tokens acima. Não usar em código novo.

## Tipografia

- Inter para tudo, títulos inclusive. `h1`-`h3` ganham `tracking-tight` pela camada base; a hierarquia vem de tamanho e peso, não de família.
- Valores financeiros: classe `num` (números tabulares) e alinhamento à direita.
- Escala: título de página `text-3xl`, seção `text-xl`, corpo `text-sm`/`text-base`, apoio `text-xs`.

Para trocar a fonte, mudar `--font-sans` em `styles.css` e o link em `index.html`.

## Espaçamento e raio

Blocos separados por `gap-6`/`space-y-6`, cards com `p-6` e `rounded-xl`, controles com `rounded-lg`. Largura máxima do conteúdo 1280px (`AppShell`).

## Componentes (`src/app/ui/`)

Todos standalone, com `input()`/`output()` em signals e sem lógica de negócio. Importar pelo barrel `src/app/ui`.

| Componente | Seletor | Para quê |
|---|---|---|
| `VlButtonComponent` | `button[vl-button]`, `a[vl-button]` | `variant` primary, secondary, ghost, danger; `size`; `loading`; `block` |
| `VlFieldComponent` + `VlInputDirective` | `vl-field`, `[vlInput]` | Label, dica e erro em volta de input, select ou textarea |
| `VlPageHeaderComponent` | `vl-page-header` | Título, subtítulo e slot `[actions]` |
| `VlKpiCardComponent` | `vl-kpi-card` | `label`, `value`, `delta`, `tone`, `hero`, `hint` (tooltip com a explicação do indicador) |
| `VlBadgeComponent` | `vl-badge` | `tone` neutral, positive, negative, warning, info, accent |
| `VlDataTableComponent` + `VlCellDirective` | `vl-data-table`, `*vlCell="'coluna'"` | Colunas declarativas, célula customizada, lista no mobile, vazio e carregando |
| `VlPaginationComponent` | `vl-pagination` | `page`, `totalPages`, `(pageChange)` |
| `VlDrawerComponent` | `vl-drawer` | Painel lateral com título, corpo e slot `[footer]`; fecha no overlay e no Esc |
| `VlEmptyStateComponent` | `vl-empty-state` | `icon`, `title`, `description`, slot de ação |
| `VlSkeletonComponent` | `vl-skeleton` | Bloco de carregamento; dimensões por classe |
| `VlPeriodSelectorComponent` | `vl-period-selector` | Segmentado Mês, 6M, Ano, Início; `[(value)]` |
| `VlBottomNavComponent` | `vl-bottom-nav` | Navegação inferior no mobile |
| `VlAppShellComponent` | `vl-app-shell` | Sidebar, header com menu do usuário (tema, alterar senha, sair), bottom nav |
| `ToastService` + `VlToastContainerComponent` | `vl-toast-container` | `toast.success('...')`, `toast.error('...')` |
| `ConfirmService` + `VlConfirmDialogComponent` | `vl-confirm-dialog` | `await confirm.ask({ title, message, danger })` |

Ícones: `lucide-angular`, registrados em `src/app/ui/icon/icons.ts`. Usar `<lucide-icon name="users" [size]="18" />`. Para adicionar um ícone, incluir no registro; nomes em kebab-case.

## Migração de uma tela

1. Trocar o cabeçalho por `vl-page-header`.
2. Trocar botões, inputs, badges e paginação pelos componentes.
3. Tabela: definir `columns` e usar `vl-data-table`; células especiais com `*vlCell`.
4. Painéis laterais: `vl-drawer`. Confirmações: `ConfirmService`. Resultado de ações: `ToastService`.
5. Remover `slate-*`, `emerald-*` e SVGs inline; usar tokens e `lucide-icon`.
6. Gerar capturas antes e depois com `docs/redesign/tools/shots.mjs`.
