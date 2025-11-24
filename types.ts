
export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  password?: string;
  enrolledCourses?: string[]; // IDs of courses the user has access to
  billing?: {
    autoPaymentEnabled: boolean;
    savedCardLast4?: string;
    subscriptionEnd?: Date;
    status?: 'active' | 'paused' | 'cancelled';
  };
}

export interface Lesson {
  id: string;
  title: string;
  duration: string; // e.g., "10:05"
  type: 'video' | 'quiz' | 'pdf';
  isCompleted: boolean;
  isLocked: boolean;
  videoUrl?: string; // For the player
  content?: string; // For text/notes
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  unlockDate?: Date; // SPRINT 8: Drip Content
}

export interface CourseSecurityConfig {
  drmEnabled: boolean;
  allowedDomains: string[]; // e.g., "lumina.edu"
  watermarkText?: string;
  geoRestriction?: string[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: Date;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  students: number;
  revenue: number;
  status: 'published' | 'draft';
  thumbnail: string;
  modules: number; // Count for dashboard
  content?: Module[]; // Detailed content for player
  description?: string;
  price: number;
  nextRelease?: string; // For drip content
  securityConfig?: CourseSecurityConfig;
  reviews?: Review[]; // SPRINT 8: Rating System
}

export interface LiveClass {
  id: string;
  title: string;
  startTime: Date;
  durationMinutes: number;
  instructorId: string;
  courseId?: string;
  meetingLink?: string; // Legacy/External link
  zoomDetails?: {
    meetingId: string;
    joinUrl: string;
    startUrl: string; // For host
    password?: string;
  };
  attendees: string[]; // List of User IDs who joined
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string; // If private message
  channelId?: string; // If group/course chat
  content: string;
  timestamp: Date;
  isOptimistic?: boolean; // For UI feedback
  attachment?: Attachment;
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  type: 'alert' | 'info' | 'success';
  message: string;
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    event: 'reschedule' | 'cancel' | 'announcement' | 'payment' | 'refund' | 'ticket';
    classId?: string;
    transactionId?: string;
    ticketId?: string;
    oldTime?: Date;
    newTime?: Date;
  };
}

export interface AnalyticsData {
  name: string;
  value: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'students' | 'teachers';
  courseId?: string; // If specific to a course
  date: Date;
  author: string;
}

// --- SPRINT 5: PAYMENTS ---
export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  description: string;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  date: Date;
  invoiceId: string;
  paymentMethod: string; // e.g. "Visa 4242"
  invoiceUrl?: string; // Virtual field for download
}

export interface Coupon {
  code: string;
  discountPercent: number;
}

// --- SPRINT 6: SUPPORT ---
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: 'Technical' | 'Billing' | 'Content' | 'Other' | 'Refund';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  relatedTransactionId?: string;
  adminResponse?: string;
}

// --- SPRINT 7: RESOURCES ---
export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'link';
  url: string;
  courseId?: string;
  description: string;
  dateAdded: Date;
  isLocked: boolean;
}
