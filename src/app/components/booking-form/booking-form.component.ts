import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService, TimeSlot } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.scss']
})
export class BookingFormComponent implements OnInit {
  @Input() restaurantId!: string;
  
  bookingForm: FormGroup;
  availableTimeSlots$!: Observable<TimeSlot[]>;
  minDate = new Date();
  maxDate = new Date();
  loading = false;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.maxDate.setMonth(this.maxDate.getMonth() + 2);
    
    this.bookingForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      partySize: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', Validators.required],
      specialRequests: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  onDateChange(): void {
    const selectedDate = this.bookingForm.get('date')?.value;
    if (selectedDate) {
      this.availableTimeSlots$ = this.bookingService.getAvailableTimeSlots(
        this.restaurantId,
        selectedDate
      );
    }
  }

  async onSubmit(): Promise<void> {
    if (this.bookingForm.invalid) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    try {
      const user = await this.authService.getCurrentUser().toPromise();
      if (!user) {
        this.snackBar.open('Будь ласка, увійдіть в систему', 'Закрити', { duration: 3000 });
        return;
      }

      const formValue = this.bookingForm.value;
      const booking = {
        restaurantId: this.restaurantId,
        userId: user.uid,
        date: formValue.date,
        time: formValue.time,
        partySize: formValue.partySize,
        customerName: formValue.customerName,
        customerEmail: formValue.customerEmail,
        customerPhone: formValue.customerPhone,
        specialRequests: formValue.specialRequests,
        status: 'pending' as const,
        createdAt: new Date()
      };

      await this.bookingService.createBooking(booking);
      
      this.snackBar.open('Бронювання успішно створено!', 'Закрити', { 
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      this.bookingForm.reset();
      this.bookingForm.patchValue({ partySize: 2 });
      
    } catch (error) {
      console.error('Error creating booking:', error);
      this.snackBar.open('Помилка при створенні бронювання', 'Закрити', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  private async loadUserData(): Promise<void> {
    const user = await this.authService.getCurrentUser().toPromise();
    if (user) {
      this.bookingForm.patchValue({
        customerName: user.displayName || '',
        customerEmail: user.email || ''
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} є обов'язковим`;
    }
    if (field?.hasError('email')) {
      return 'Введіть правильний email';
    }
    if (field?.hasError('min')) {
      return 'Мінімальна кількість гостей: 1';
    }
    if (field?.hasError('max')) {
      return 'Максимальна кількість гостей: 20';
    }
    return '';
  }
}