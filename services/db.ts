
import { User, Course, LiveClass, Message, Announcement, Notification, UserRole, Transaction, Coupon, SupportTicket, Resource, Review } from '../types';
import { MOCK_USERS, MOCK_COURSES, MOCK_LIVE_CLASSES, MOCK_ANNOUNCEMENTS, MOCK_MESSAGES, MOCK_NOTIFICATIONS, MOCK_TRANSACTIONS, MOCK_COUPONS, MOCK_TICKETS, MOCK_RESOURCES } from '../constants';
import { db_firestore } from '../firebaseConfig';
import { doc, setDoc, deleteDoc, collection } from 'firebase/firestore';

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

// Firestore Dual Write Helper
// This allows us to satisfy "Use Firebase as Storage" while maintaining the app's existing synchronous architecture.
const firestoreSave = (collectionName: string, id: string, data: any) => {
    if (db_firestore) {
        // Deep clone and simple sanitization to avoid undefined values in Firestore
        try {
            const cleanData = JSON.parse(JSON.stringify(data));
            setDoc(doc(db_firestore, collectionName, id), cleanData)
                .catch(e => console.warn(`Firestore write failed for ${collectionName}/${id}:`, e));
        } catch(e) {
            console.error("Firestore sync error", e);
        }
    }
};

const firestoreDelete = (collectionName: string, id: string) => {
    if (db_firestore) {
        deleteDoc(doc(db_firestore, collectionName, id))
            .catch(e => console.warn(`Firestore delete failed for ${collectionName}/${id}:`, e));
    }
};

export const db = {
  users: {
    getAll: () => load<User>(KEYS.USERS, MOCK_USERS),
    add: (user: User) => {
      const users = db.users.getAll();
      save(KEYS.USERS, [...users, user]);
      firestoreSave('users', user.id, user); // Sync
      return user;
    },
    update: (user: User) => {
        const users = db.users.getAll().map(u => u.id === user.id ? user : u);
        save(KEYS.USERS, users);
        firestoreSave('users', user.id, user); // Sync
        return user;
    },
    delete: (userId: string) => {
        const users = db.users.getAll().filter(u => u.id !== userId);
        save(KEYS.USERS, users);
        firestoreDelete('users', userId); // Sync
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
        const user = updatedUsers.find(u => u.id === userId);
        if(user) firestoreSave('users', userId, user); // Sync
        return user;
    },
    find: (email: string) => db.users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()),
    findById: (id: string) => db.users.getAll().find(u => u.id === id),
    
    // SPRINT 9: Sync Firebase User to Local DB
    syncGoogleUser: (firebaseUser: any): User => {
        const users = db.users.getAll();
        const existing = users.find(u => u.email === firebaseUser.email);
        
        if (existing) {
            if (firebaseUser.photoURL && existing.avatar !== firebaseUser.photoURL) {
                const updated = { ...existing, avatar: firebaseUser.photoURL };
                db.users.update(updated);
                return updated;
            }
            return existing;
        }

        const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Lumina Student',
            email: firebaseUser.email,
            role: 'student', 
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName)}`,
            billing: { autoPaymentEnabled: false, status: 'active' },
            enrolledCourses: []
        };
        
        db.users.add(newUser); // This now also triggers firestoreSave
        return newUser;
    }
  },
  courses: {
    getAll: () => load<Course>(KEYS.COURSES, MOCK_COURSES),
    add: (course: Course) => {
      const list = db.courses.getAll();
      save(KEYS.COURSES, [course, ...list]);
      firestoreSave('courses', course.id, course);
      return course;
    },
    update: (course: Course) => {
        const list = db.courses.getAll().map(c => c.id === course.id ? course : c);
        save(KEYS.COURSES, list);
        firestoreSave('courses', course.id, course);
    },
    delete: (courseId: string) => {
        const list = db.courses.getAll().filter(c => c.id !== courseId);
        save(KEYS.COURSES, list);
        firestoreDelete('courses', courseId);
    },
    addReview: (courseId: string, review: Review) => {
        const list = db.courses.getAll().map(c => {
            if (c.id === courseId) {
                const updated = { ...c, reviews: [review, ...(c.reviews || [])] };
                return updated;
            }
            return c;
        });
        save(KEYS.COURSES, list);
        const course = list.find(c => c.id === courseId);
        if(course) firestoreSave('courses', course.id, course);
        return course;
    }
  },
  announcements: {
    getAll: () => load<Announcement>(KEYS.ANNOUNCEMENTS, MOCK_ANNOUNCEMENTS),
    add: (item: Announcement) => {
      const list = db.announcements.getAll();
      save(KEYS.ANNOUNCEMENTS, [item, ...list]);
      firestoreSave('announcements', item.id, item);
      return item;
    },
    delete: (id: string) => {
       const list = db.announcements.getAll().filter(i => i.id !== id);
       save(KEYS.ANNOUNCEMENTS, list);
       firestoreDelete('announcements', id);
    }
  },
  classes: {
    getAll: () => load<LiveClass>(KEYS.CLASSES, MOCK_LIVE_CLASSES),
    add: (cls: LiveClass) => {
        const list = db.classes.getAll();
        save(KEYS.CLASSES, [...list, cls]);
        firestoreSave('classes', cls.id, cls);
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
        const cls = list.find(c => c.id === classId);
        if(cls) firestoreSave('classes', cls.id, cls);
        return cls;
    },
    cancel: (classId: string, requestedByRole: UserRole, userName: string): { success: boolean, error?: string } => {
        const list = db.classes.getAll();
        const cls = list.find(c => c.id === classId);
        if (!cls) return { success: false, error: 'Class not found' };

        if (requestedByRole === 'teacher') {
            cls.status = 'cancelled';
            save(KEYS.CLASSES, list);
            firestoreSave('classes', cls.id, cls); // Sync update

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

        if (requestedByRole === 'teacher') {
            const oldTime = cls.startTime;
            cls.startTime = newTime;
            cls.status = 'scheduled';
            save(KEYS.CLASSES, list);
            firestoreSave('classes', cls.id, cls);

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
       firestoreSave('messages', msg.id, msg);
       return msg;
    }
  },
  notifications: {
      getAll: () => load<Notification>(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS),
      add: (n: Notification) => {
          const list = db.notifications.getAll();
          save(KEYS.NOTIFICATIONS, [n, ...list]);
          firestoreSave('notifications', n.id, n);
          return n;
      },
      markRead: (id: string) => {
          const list = db.notifications.getAll().map(n => n.id === id ? { ...n, isRead: true } : n);
          save(KEYS.NOTIFICATIONS, list);
          // Sync read status? Maybe skipped for MVP performance
      }
  },
  transactions: {
      getAll: () => load<Transaction>(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS),
      getByUser: (userId: string) => db.transactions.getAll().filter(t => t.userId === userId),
      add: (t: Transaction) => {
          const list = db.transactions.getAll();
          save(KEYS.TRANSACTIONS, [t, ...list]);
          firestoreSave('transactions', t.id, t);
          return t;
      },
      refund: (transactionId: string) => {
          const list = db.transactions.getAll().map(t => 
              t.id === transactionId ? { ...t, status: 'refunded' as const } : t
          );
          save(KEYS.TRANSACTIONS, list);
          const t = list.find(tx => tx.id === transactionId);
          if(t) firestoreSave('transactions', t.id, t);
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
          firestoreSave('tickets', t.id, t);
          return t;
      },
      update: (ticket: SupportTicket) => {
          const list = db.tickets.getAll().map(t => t.id === ticket.id ? ticket : t);
          save(KEYS.TICKETS, list);
          firestoreSave('tickets', ticket.id, ticket);
          return ticket;
      }
  },
  resources: {
      getAll: () => load<Resource>(KEYS.RESOURCES, MOCK_RESOURCES),
      add: (r: Resource) => {
          const list = db.resources.getAll();
          save(KEYS.RESOURCES, [r, ...list]);
          firestoreSave('resources', r.id, r);
          return r;
      }
  }
};
