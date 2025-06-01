import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { Restaurant, RestaurantService } from '../../services/restaurant.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatGridListModule],
  template: `
    <div class="restaurant-grid">
      <mat-grid-list cols="3" rowHeight="400px">
        <mat-grid-tile *ngFor="let restaurant of restaurants$ | async">
          <mat-card class="restaurant-card">
            <mat-card-header>
              <mat-card-title>{{restaurant.name}}</mat-card-title>
              <mat-card-subtitle>{{restaurant.cuisine}} • {{restaurant.priceRange}}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{restaurant.description}}</p>
              <p><strong>Рейтинг:</strong> {{restaurant.rating}}/5</p>
              <p><strong>Адреса:</strong> {{restaurant.address}}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary">Забронювати</button>
            </mat-card-actions>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .restaurant-grid {
      padding: 20px;
    }
    .restaurant-card {
      width: 90%;
      height: 90%;
    }
  `]
})
export class RestaurantListComponent implements OnInit {
  restaurants$: Observable<Restaurant[]>;

  constructor(private restaurantService: RestaurantService) {
    this.restaurants$ = this.restaurantService.getRestaurants();
  }

  ngOnInit(): void {}
}