import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Booking {
  id?: string;
  restaurantId: string;
  userId: string;
  date: Date;
  time: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
  booked: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(private afs: AngularFirestore) {}

  createBooking(booking: Booking): Promise<void> {
    const id = this.afs.createId();
    return this.afs.collection('bookings').doc(id).set({
      ...booking,
      id,
      createdAt: new Date()
    });
  }

  getBookingsByUser(userId: string): Observable<Booking[]> {
    return this.afs.collection<Booking>('bookings', ref =>
      ref.where('userId', '==', userId)
         .orderBy('date', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Booking;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  getBookingsByRestaurant(restaurantId: string): Observable<Booking[]> {
    return this.afs.collection<Booking>('bookings', ref =>
      ref.where('restaurantId', '==', restaurantId)
         .orderBy('date', 'desc')
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Booking;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  updateBookingStatus(bookingId: string, status: string): Promise<void> {
    return this.afs.collection('bookings').doc(bookingId).update({ status });
  }

  getAvailableTimeSlots(restaurantId: string, date: Date): Observable<TimeSlot[]> {
    const dateStr = date.toISOString().split('T')[0];
    
    return this.afs.collection<Booking>('bookings', ref =>
      ref.where('restaurantId', '==', restaurantId)
         .where('date', '==', date)
         .where('status', 'in', ['pending', 'confirmed'])
    ).valueChanges().pipe(
      map(bookings => {
        const timeSlots: TimeSlot[] = [];
        const restaurantHours = this.getRestaurantHours();
        
        restaurantHours.forEach(time => {
          const bookedForTime = bookings.filter(b => b.time === time);
          const totalBooked = bookedForTime.reduce((sum, b) => sum + b.partySize, 0);
          const capacity = 50; // Default restaurant capacity
          
          timeSlots.push({
            time,
            available: totalBooked < capacity,
            capacity,
            booked: totalBooked
          });
        });
        
        return timeSlots;
      })
    );
  }

  private getRestaurantHours(): string[] {
    const hours = [];
    for (let i = 11; i <= 22; i++) {
      hours.push(`${i}:00`);
      if (i !== 22) {
        hours.push(`${i}:30`);
      }
    }
    return hours;
  }

  cancelBooking(bookingId: string): Promise<void> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  }

  confirmBooking(bookingId: string): Promise<void> {
    return this.updateBookingStatus(bookingId, 'confirmed');
  }
}