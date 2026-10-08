import { Routes } from '@angular/router';
import { ClientAreaLayoutComponent } from './layout/layout.component';
import { OperationsComponent } from './operations/operations.component';
import { StatementComponent } from './statement/statement.component';
import { ClientDashboardComponent } from './dashboard/dashboard.component';
// Os componentes que iremos criar

// Rotas da área do Cliente, carregadas sob /sistema
export const CLIENT_ROUTES: Routes = [
    {
        path: '',
        component: ClientAreaLayoutComponent, // O Layout do Cliente envolve todas as páginas de cliente
        children: [
            {
                path: '',
                redirectTo: 'dashboard', // Rota padrão redireciona para o dashboard
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: ClientDashboardComponent,
                title: 'Meu Painel'
            },
            {
                path: 'statement',
                component: StatementComponent,
                title: 'Extrato Financeiro'
            },
            {
                path: 'operations',
                component: OperationsComponent,
                title: 'Relação de Operações'
            },
            // Adicione outras rotas de cliente aqui
        ]
    }
];
