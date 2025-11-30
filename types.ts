import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
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