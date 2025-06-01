import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Restaurant {
  id?: string;
  name: string;
  description: string;
  cuisine: string;
  priceRange: ' | '$' | '$ | '$$';
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  imageUrls: string[];
  openingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  amenities: string[];
  ownerId: string;
  createdAt: Date;
  featured: boolean;
}

export interface Review {
  id?: string;
  restaurantId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  constructor(private afs: AngularFirestore) {}

  getRestaurants(): Observable<Restaurant[]> {
    return this.afs.collection<Restaurant>('restaurants', ref =>
      ref.orderBy('rating', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Restaurant;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getRestaurantById(id: string): Observable<Restaurant | undefined> {
    return this.afs.collection('restaurants').doc<Restaurant>(id).valueChanges({ idField: 'id' });
  }

  getFeaturedRestaurants(): Observable<Restaurant[]> {
    return this.afs.collection<Restaurant>('restaurants', ref =>
      ref.where('featured', '==', true)
         .orderBy('rating', 'desc')
         .limit(6)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Restaurant;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  searchRestaurants(filters: any): Observable<Restaurant[]> {
    let query = this.afs.collection<Restaurant>('restaurants').ref;

    if (filters.cuisine && filters.cuisine !== 'all') {
      query = query.where('cuisine', '==', filters.cuisine);
    }

    if (filters.priceRange) {
      query = query.where('priceRange', '==', filters.priceRange);
    }

    if (filters.city) {
      query = query.where('city', '==', filters.city);
    }

    return this.afs.collection<Restaurant>('restaurants', ref => query)
      .snapshotChanges().pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Restaurant;
          const id = a.payload.doc.id;
          return { id, ...data };
        }))
      );
  }

  createRestaurant(restaurant: Restaurant): Promise<void> {
    const id = this.afs.createId();
    return this.afs.collection('restaurants').doc(id).set({
      ...restaurant,
      id,
      createdAt: new Date(),
      rating: 0,
      reviewCount: 0
    });
  }

  updateRestaurant(id: string, restaurant: Partial<Restaurant>): Promise<void> {
    return this.afs.collection('restaurants').doc(id).update(restaurant);
  }

  deleteRestaurant(id: string): Promise<void> {
    return this.afs.collection('restaurants').doc(id).delete();
  }

  getReviews(restaurantId: string): Observable<Review[]> {
    return this.afs.collection<Review>('reviews', ref =>
      ref.where('restaurantId', '==', restaurantId)
         .orderBy('createdAt', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Review;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  addReview(review: Review): Promise<void> {
    const id = this.afs.createId();
    return this.afs.collection('reviews').doc(id).set({
      ...review,
      id,
      createdAt: new Date()
    });
  }

  getCuisineTypes(): Observable<string[]> {
    return this.afs.collection<Restaurant>('restaurants').valueChanges().pipe(
      map(restaurants => {
        const cuisines = restaurants.map(r => r.cuisine);
        return [...new Set(cuisines)].sort();
      })
    );
  }
}