import { Routes } from '@angular/router';
import { afterLogin, beforeLogin } from './services/guard.service';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full', data: { title: 'Home' } },
    {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [beforeLogin],
        data: { title: 'Login' }
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [afterLogin],
        data: { title: 'Dashboard' }
    },
    {
        path: 'data-sources',
        canActivate: [afterLogin],
        children: [
            {
                path: '',
                loadComponent: () => import('./components/data-source/data-source-view/data-source-view.component').then(m => m.DataSourceViewComponent),
                data: { title: 'Data Sources' }
            },
            {
                path: 'create',
                loadComponent: () => import('./components/data-source/data-source-add/data-source-add.component').then(m => m.DataSourceAddComponent),
                data: { title: 'Create Data Source' }
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./components/data-source/data-source-edit/data-source-edit.component').then(m => m.DataSourceEditComponent),
                data: { title: 'Edit Data Source' }
            },
            {
                path: ':id',
                loadComponent: () => import('./components/data-source/data-source-detail/data-source-detail.component').then(m => m.DataSourceDetailComponent),
                data: { title: 'Data Source Detail' }
            }
        ]
    },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
