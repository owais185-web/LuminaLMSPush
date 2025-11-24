
import { User, Course, LiveClass, Message, Announcement, Notification, UserRole, Transaction, Coupon, SupportTicket, Resource, Review } from '../types';
import { MOCK_USERS, MOCK_COURSES, MOCK_LIVE_CLASSES, MOCK_ANNOUNCEMENTS, MOCK_MESSAGES, MOCK_NOTIFICATIONS, MOCK_TRANSACTIONS, MOCK_COUPONS, MOCK_TICKETS, MOCK_RESOURCES } from '../constants';

const KEYS = {
  USERS: 'lumina_users',
  COURSES: 'lumina_courses',
  CLASSES: 'lumina_classes',
  ANNOUNCEMENTS: 'lumina_announcements',
  MESSAGES: 'lumina_messages',
  NOTIFICATIONS: 'lumina_notifications',
  TRANSACTIONS: 'lumina_transactions',
  COUPONS: 'lumina_coupons',
  TICKETS: 'lumina_tickets',
  RESOURCES: 'lumina_resources'
};

// Helper to parse JSON with Dates
const jsonReviver = (key: string, value: any) => {
  // Simple regex for ISO dates coming from JSON.stringify
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value);
  }
  return value;
};

function load<T>(key: string, seed: T[]): T[] {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item, jsonReviver);
    }
    // Seed database if empty
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch (e) {
    console.error('DB Load Error', e);
    return seed;
  }
}

function save(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('DB Save Error', e);
  }
}

export const db = {
  users: {
    getAll: () => load<User>(KEYS.USERS, MOCK_USERS),
    add: (user: User) => {
      const users = db.users.getAll();
      save(KEYS.USERS, [...users, user]);
      return user;
    },
    update: (user: User) => {
        const users = db.users.getAll().map(u => u.id === user.id ? user : u);
        save(KEYS.USERS, users);
        return user;
    },
    delete: (userId: string) => {
        const users = db.users.getAll().filter(u => u.id !== userId);
        save(KEYS.USERS, users);
    },
    enroll: (userId: string, courseId: string) => {
        const users = db.users.getAll();
        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                const enrolled = u.enrolledCourses || [];
                if (!enrolled.includes(courseId)) {
                    return { ...u, enrolledCourses: [...enrolled, courseId] };
                }
            }
            return u;
        });
        save(KEYS.USERS, updatedUsers);
        return updatedUsers.find(u => u.id === userId);
    },
    find: (email: string) => db.users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()),
    findById: (id: string) => db.users.getAll().find(u => u.id === id),
    
    // SPRINT 9: Sync Firebase User to Local DB
    // This bridges the gap between Firebase Auth and the app's mock data structure
    syncGoogleUser: (firebaseUser: any): User => {
        const users = db.users.getAll();
        const existing = users.find(u => u.email === firebaseUser.email);
        
        if (existing) {
            // Update avatar if changed on Google
            if (firebaseUser.photoURL && existing.avatar !== firebaseUser.photoURL) {
                const updated = { ...existing, avatar: firebaseUser.photoURL };
                db.users.update(updated);
                return updated;
            }
            return existing;
        }

        // Create new student user from Google Data
        const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Lumina Student',
            email: firebaseUser.email,
            role: 'student', // Default role for new signups
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName)}`,
            billing: {
                autoPaymentEnabled: false,
                status: 'active'
            },
            enrolledCourses: []
        };
        
        db.users.add(newUser);
        return newUser;
    }
  },
  courses: {
    getAll: () => load<Course>(KEYS.COURSES, MOCK_COURSES),
    add: (course: Course) => {
      const list = db.courses.getAll();
      save(KEYS.COURSES, [course, ...list]); // Add to top
      return course;
    },
    update: (course: Course) => {
        const list = db.courses.getAll().map(c => c.id === course.id ? course : c);
        save(KEYS.COURSES, list);
    },
    delete: (courseId: string) => {
        const list = db.courses.getAll().filter(c => c.id !== courseId);
        save(KEYS.COURSES, list);
    },
    addReview: (courseId: string, review: Review) => {
        const list = db.courses.getAll().map(c => {
            if (c.id === courseId) {
                return { ...c, reviews: [review, ...(c.reviews || [])] };
            }
            return c;
        });
        save(KEYS.COURSES, list);
        return list.find(c => c.id === courseId);
    }
  },
  announcements: {
    getAll: () => load<Announcement>(KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS),
    add: (item: Announcement) => {
      const list = db.announcements.getAll();
      save(KEYS.ANNOUNCEMENTS, [item, ...list]);
      return item;
    },
    delete: (id: string) => {
       const list = db.announcements.getAll().filter(i => i.id !== id);
       save(KEYS.ANNOUNCEMENTS, list);
    }
  },
  classes: {
    getAll: () => load<LiveClass>(KEYS.CLASSES, MOCK_LIVE_CLASSES),
    add: (cls: LiveClass) => {
        const list = db.classes.getAll();
        save(KEYS.CLASSES, [...list, cls]);
        return cls;
    },
    markAttendance: (classId: string, userId: string) => {
        const list = db.classes.getAll().map(cls => {
            if (cls.id === classId) {
                const currentAttendees = cls.attendees || [];
                if (!currentAttendees.includes(userId)) {
                    return { ...cls, attendees: [...currentAttendees, userId] };
                }
            }
            return cls;
        });
        save(KEYS.CLASSES, list);
        return list.find(c => c.id === classId);
    },
    cancel: (classId: string, requestedByRole: UserRole, userName: string): { success: boolean, error?: string } => {
        const list = db.classes.getAll();
        const cls = list.find(c => c.id === classId);
        if (!cls) return { success: false, error: 'Class not found' };

        const now = new Date();
        const start = new Date(cls.startTime);
        const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (requestedByRole === 'teacher') {
            if (diffHours < 4) {
                return { success: false, error: 'Cannot cancel class less than 4 hours before start time.' };
            }
            cls.status = 'cancelled';
            save(KEYS.CLASSES, list);

            db.notifications.add({
                id: `n${Date.now()}`,
                userId: 'u1',
                type: 'alert',
                message: `${userName} cancelled class "${cls.title}".`,
                timestamp: new Date(),
                isRead: false,
                metadata: { event: 'cancel', classId: cls.id }
            });
            return { success: true };
        }

        if (requestedByRole === 'student') {
             db.notifications.add({
                id: `n${Date.now()}`,
                userId: 'u1',
                type: 'info',
                message: `${userName} withdrew from class "${cls.title}".`,
                timestamp: new Date(),
                isRead: false,
                metadata: { event: 'cancel', classId: cls.id }
            });
            return { success: true };
        }
        return { success: false, error: 'Unauthorized' };
    },
    reschedule: (classId: string, newTime: Date, requestedByRole: UserRole, userName: string): { success: boolean, error?: string } => {
        const list = db.classes.getAll();
        const cls = list.find(c => c.id === classId);
        if (!cls) return { success: false, error: 'Class not found' };

        const now = new Date();
        const start = new Date(cls.startTime);
        const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 4) {
            return { success: false, error: 'Cannot reschedule less than 4 hours before start time.' };
        }

        if (requestedByRole === 'teacher') {
            const oldTime = cls.startTime;
            cls.startTime = newTime;
            cls.status = 'scheduled';
            save(KEYS.CLASSES, list);
            db.notifications.add({
                id: `n${Date.now()}`,
                userId: 'u1',
                type: 'alert',
                message: `${userName} rescheduled class "${cls.title}".`,
                timestamp: new Date(),
                isRead: false,
                metadata: { event: 'reschedule', classId: cls.id, oldTime, newTime }
            });
            return { success: true };
        } else if (requestedByRole === 'student') {
             db.notifications.add({
                id: `n${Date.now()}`,
                userId: 'u1',
                type: 'info',
                message: `${userName} REQUESTED reschedule for "${cls.title}" to ${newTime.toLocaleString()}.`,
                timestamp: new Date(),
                isRead: false,
                metadata: { event: 'reschedule', classId: cls.id, oldTime: cls.startTime, newTime }
            });
            return { success: true, error: 'Request sent to Admin.' };
        }
        return { success: false };
    }
  },
  messages: {
    getAll: () => load<Message>(KEYS.MESSAGES, MOCK_MESSAGES),
    add: (msg: Message) => {
       const list = db.messages.getAll();
       save(KEYS.MESSAGES, [...list, msg]);
       return msg;
    }
  },
  notifications: {
      getAll: () => load<Notification>(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS),
      add: (n: Notification) => {
          const list = db.notifications.getAll();
          save(KEYS.NOTIFICATIONS, [n, ...list]);
          return n;
      },
      markRead: (id: string) => {
          const list = db.notifications.getAll().map(n => n.id === id ? { ...n, isRead: true } : n);
          save(KEYS.NOTIFICATIONS, list);
      }
  },
  transactions: {
      getAll: () => load<Transaction>(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS),
      getByUser: (userId: string) => db.transactions.getAll().filter(t => t.userId === userId),
      add: (t: Transaction) => {
          const list = db.transactions.getAll();
          save(KEYS.TRANSACTIONS, [t, ...list]);
          return t;
      },
      refund: (transactionId: string) => {
          const list = db.transactions.getAll().map(t => 
              t.id === transactionId ? { ...t, status: 'refunded' as const } : t
          );
          save(KEYS.TRANSACTIONS, list);
      }
  },
  coupons: {
      getAll: () => load<Coupon>(KEYS.COUPONS, MOCK_COUPONS),
      find: (code: string) => db.coupons.getAll().find(c => c.code.toUpperCase() === code.toUpperCase())
  },
  tickets: {
      getAll: () => load<SupportTicket>(KEYS.TICKETS, MOCK_TICKETS),
      add: (t: SupportTicket) => {
          const list = db.tickets.getAll();
          save(KEYS.TICKETS, [t, ...list]);
          return t;
      },
      update: (ticket: SupportTicket) => {
          const list = db.tickets.getAll().map(t => t.id === ticket.id ? ticket : t);
          save(KEYS.TICKETS, list);
          return ticket;
      }
  },
  resources: {
      getAll: () => load<Resource>(KEYS.RESOURCES, MOCK_RESOURCES),
      add: (r: Resource) => {
          const list = db.resources.getAll();
          save(KEYS.RESOURCES, [r, ...list]);
          return r;
      }
  }
};
