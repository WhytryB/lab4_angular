import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );
  }

  async signUp(email: string, password: string, userData: any): Promise<void> {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      if (credential.user) {
        await this.updateUserData(credential.user, userData);
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.afAuth.signOut();
    this.router.navigate(['/']);
  }

  async googleSignIn(): Promise<void> {
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await this.afAuth.signInWithPopup(provider);
    if (credential.user) {
      await this.updateUserData(credential.user);
      this.router.navigate(['/dashboard']);
    }
  }

  private updateUserData(user: firebase.User, additionalData?: any): Promise<void> {
    const userRef = this.afs.doc(`users/${user.uid}`);
    const data = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData?.displayName,
      photoURL: user.photoURL,
      role: additionalData?.role || 'customer',
      ...additionalData
    };
    return userRef.set(data, { merge: true });
  }

  isAuthenticated(): Observable<boolean> {
    return this.afAuth.authState.pipe(map(user => !!user));
  }

  getCurrentUser(): Observable<firebase.User | null> {
    return this.afAuth.authState;
  }
}