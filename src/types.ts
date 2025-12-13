import { Timestamp } from 'firebase/firestore';

// Fix for missing JSX.IntrinsicElements definitions
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
}

export interface WorkerProfile {
  uid: string;
  displayName: string;
  phone: string;
  bio: string; // Brief introduction
  coordinates: Coordinates; // Base location
  address: string;
  experienceYears: number;
  isAvailable: boolean;
  photoUrl?: string; // Profile picture
  
  // New Fields
  maxDistance: number; // Work coverage radius in km
  equipmentCount: number; // Number of brush cutters owned
  portfolioUrls: string[]; // List of work portfolio image URLs
  isApproved: boolean; // Admin approval status
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export enum ReservationStatus {
  PENDING = '접수대기',
  CONFIRMED = '예약확정',
  COMPLETED = '작업완료',
  CANCELLED = '취소됨'
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  locationName: string; // Address or Place Name
  coordinates: Coordinates;
  requestDate: string; // YYYY-MM-DD
  description: string;
  imageUrls: string[];
  status: ReservationStatus;
  createdAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  isRead: boolean;
}

export interface ChatRoom {
  id: string; // usually userId of the customer
  customerName: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  photoUrl?: string;
  createdAt: Timestamp;
}