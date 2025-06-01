import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/restaurants', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'restaurants', 
    loadComponent: () => import('./components/restaurant-list/restaurant-list.component').then(m => m.RestaurantListComponent) 
  },
  { 
    path: 'bookings', 
    loadComponent: () => import('./components/booking-form/booking-form.component').then(m => m.BookingFormComponent),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }