import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/home/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'delivery-list',
    loadComponent: () => import('./pages/delivery/delivery-list/delivery-list.page').then( m => m.DeliveryListPage)
  },
  {
    path: 'delivery-map',
    loadComponent: () => import('./pages/delivery/delivery-map/delivery-map.page').then( m => m.DeliveryMapPage)
  },
  {
    path: 'delivery-detail',
    loadComponent: () => import('./pages/delivery/delivery-detail/delivery-detail.page').then( m => m.DeliveryDetailPage)
  },
  {
    path: 'delivery-complete',
    loadComponent: () => import('./pages/delivery/delivery-complete/delivery-complete.page').then( m => m.DeliveryCompletePage)
  },
  {
    path: 'day-summary',
    loadComponent: () => import('./pages/summary/day-summary/day-summary.page').then( m => m.DaySummaryPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile/profile.page').then( m => m.ProfilePage)
  },
];
