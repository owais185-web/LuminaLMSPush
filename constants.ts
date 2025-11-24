
import { User, Course, LiveClass, Message, AnalyticsData, Announcement, Notification, Transaction, Coupon, SupportTicket, Resource } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin Alice', role: 'admin', avatar: 'https://picsum.photos/seed/admin/200', email: 'admin@lumina.com', password: 'password123' },
  { id: 'u2', name: 'Prof. Snape', role: 'teacher', avatar: 'https://picsum.photos/seed/teacher/200', email: 'snape@lumina.com', password: 'password123' },
  { 
    id: 'u3', 
    name: 'Harry P.', 
    role: 'student', 
    avatar: 'https://picsum.photos/seed/student/200', 
    email: 'harry@hogwarts.edu', 
    password: 'password123', 
    enrolledCourses: ['c1'],
    billing: {
        autoPaymentEnabled: true,
        savedCardLast4: '4242',
        subscriptionEnd: new Date('2024-01-01'),
        status: 'active'
    }
  },
];

const now = new Date();

const COURSE_CONTENT_MOCK = [
  {
    id: 'm1',
    title: 'Module 1: Fundamentals',
    unlockDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // Unlocked 30 days ago
    lessons: [
      { id: 'l1', title: 'Introduction to the Course', duration: '05:20', type: 'video', isCompleted: true, isLocked: false, videoUrl: 'https://example.com/video1' },
      { id: 'l2', title: 'Setting Up Your Environment', duration: '12:45', type: 'video', isCompleted: true, isLocked: false, videoUrl: 'https://example.com/video2' },
      { id: 'l3', title: 'Core Concepts Quiz', duration: '10 mins', type: 'quiz', isCompleted: false, isLocked: false },
    ]
  },
  {
    id: 'm2',
    title: 'Module 2: Advanced Patterns',
    unlockDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), // Unlocked yesterday
    lessons: [
      { id: 'l4', title: 'Higher Order Components', duration: '15:30', type: 'video', isCompleted: false, isLocked: false },
      { id: 'l5', title: 'Custom Hooks Deep Dive', duration: '18:15', type: 'video', isCompleted: false, isLocked: true },
    ]
  },
  {
    id: 'm3',
    title: 'Module 3: The Future',
    unlockDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7), // Unlock in 7 days (DRIP)
    lessons: [
      { id: 'l6', title: 'NextJS Integration', duration: '20:00', type: 'video', isCompleted: false, isLocked: true },
    ]
  }
];

export const MOCK_COURSES: Course[] = [
  { 
    id: 'c1', 
    title: 'Advanced Potions & React Hooks', 
    instructor: 'Prof. Snape', 
    students: 1240, 
    revenue: 124000, 
    status: 'published',
    thumbnail: 'https://picsum.photos/seed/course1/400/200',
    modules: 12,
    price: 150,
    content: COURSE_CONTENT_MOCK as any,
    description: "Master the delicate art of state management and potion brewing. This comprehensive course covers everything from basic useState cauldrons to advanced Redux elixirs.",
    nextRelease: '2023-12-01',
    securityConfig: { drmEnabled: true, allowedDomains: ['lumina.edu'], watermarkText: 'Lumina Student' },
    reviews: [
        { id: 'r1', userId: 'u99', userName: 'Hermione G.', rating: 5, comment: 'Absolutely brilliant! The hooks section was magical.', date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10) },
        { id: 'r2', userId: 'u98', userName: 'Ron W.', rating: 4, comment: 'A bit tough, but very rewarding.', date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5) }
    ]
  },
  { 
    id: 'c2', 
    title: 'Defense Against the Dark UX', 
    instructor: 'Prof. Lupin', 
    students: 850, 
    revenue: 85000, 
    status: 'published',
    thumbnail: 'https://picsum.photos/seed/course2/400/200',
    modules: 8,
    price: 120,
    content: COURSE_CONTENT_MOCK as any,
    description: "Learn to identify and banish dark patterns from your user interfaces. Protect your users from cognitive overload and deceptive design.",
    reviews: []
  },
  { 
    id: 'c3', 
    title: 'History of Magic & CSS', 
    instructor: 'Prof. Binns', 
    students: 300, 
    revenue: 15000, 
    status: 'draft',
    thumbnail: 'https://picsum.photos/seed/course3/400/200',
    modules: 0,
    price: 90
  },
];

// Dynamic date generation for "Upcoming" feel
export const MOCK_LIVE_CLASSES: LiveClass[] = [
  {
    id: 'lc1',
    title: 'Live Code Review: Optimization',
    startTime: new Date(now.getTime() + 1000 * 60 * 45), // Starts in 45 mins
    durationMinutes: 60,
    instructorId: 'u2',
    courseId: 'c1',
    meetingLink: 'https://zoom.us/j/mock-meeting-link',
    attendees: [],
    status: 'scheduled'
  },
  {
    id: 'lc2',
    title: 'Q&A Session: State Management',
    startTime: new Date(now.getTime() + 1000 * 60 * 60 * 24), // Tomorrow
    durationMinutes: 90,
    instructorId: 'u2',
    courseId: 'c1',
    attendees: ['u3'],
    status: 'scheduled'
  }
];

export const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: 'u3', senderName: 'Harry P.', content: 'Is the advanced hooks module available yet?', timestamp: new Date(now.getTime() - 1000 * 60 * 60), channelId: 'general' },
  { id: 'm2', senderId: 'u2', senderName: 'Prof. Snape', content: 'It releases tomorrow at 9 AM sharp. Do not be late.', timestamp: new Date(now.getTime() - 1000 * 60 * 30), channelId: 'general' },
  { 
    id: 'm3', 
    senderId: 'u2', 
    senderName: 'Prof. Snape', 
    content: 'Here is the syllabus for the test.', 
    timestamp: new Date(now.getTime() - 1000 * 60 * 15), 
    channelId: 'general',
    attachment: { type: 'file', name: 'syllabus_v2.pdf', url: '#' } 
  },
  // Course Specific Chat
  { id: 'm4', senderId: 'u3', senderName: 'Harry P.', content: 'Anyone else struggling with the reducer in Module 2?', timestamp: new Date(now.getTime() - 1000 * 60 * 5), channelId: 'c1' },
];

export const ADMIN_STATS: AnalyticsData[] = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Platform Maintenance Scheduled',
    content: 'Lumina will undergo scheduled maintenance this Sunday from 2 AM to 4 AM EST.',
    audience: 'all',
    date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    author: 'System Admin'
  },
  {
    id: 'a2',
    title: 'New Grading Policy',
    content: 'Please review the updated grading rubrics in the Teacher Handbook.',
    audience: 'teachers',
    date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
    author: 'Dean of Studies'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        userId: 'u1',
        type: 'alert',
        message: 'Class "Intro to Potions" was cancelled by Prof. Snape.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 120),
        isRead: false,
        metadata: { event: 'cancel', classId: 'lc99' }
    },
    {
        id: 'n2',
        userId: 'u1',
        type: 'info',
        message: 'Harry P. requested a reschedule for "Defense Arts".',
        timestamp: new Date(now.getTime() - 1000 * 60 * 200),
        isRead: true,
        metadata: { event: 'reschedule', classId: 'lc98' }
    }
];

// SPRINT 5
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    userId: 'u3',
    userName: 'Harry P.',
    description: 'Course Enrollment: Advanced Potions',
    amount: 150.00,
    status: 'succeeded',
    date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    invoiceId: 'INV-0001',
    paymentMethod: 'Visa 4242'
  },
  {
    id: 'tx_2',
    userId: 'u3',
    userName: 'Harry P.',
    description: 'Monthly Subscription: All-Access',
    amount: 29.00,
    status: 'succeeded',
    date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    invoiceId: 'INV-0000',
    paymentMethod: 'Visa 4242'
  },
  {
    id: 'tx_3',
    userId: 'u3',
    userName: 'Harry P.',
    description: 'E-Book: Defensive Spells',
    amount: 15.00,
    status: 'refunded',
    date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    invoiceId: 'INV-0002',
    paymentMethod: 'Visa 4242'
  }
];

export const MOCK_COUPONS: Coupon[] = [
  { code: 'WELCOME20', discountPercent: 20 },
  { code: 'POTIONS10', discountPercent: 10 },
  { code: 'MAGIC50', discountPercent: 50 },
];

// SPRINT 6: SUPPORT TICKETS
export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 't1',
    userId: 'u3',
    userName: 'Harry P.',
    subject: 'Video playback issue on Module 2',
    category: 'Technical',
    description: 'I keep getting a black screen when I try to load the "Advanced Patterns" video.',
    status: 'open',
    priority: 'high',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2)
  },
  {
    id: 't2',
    userId: 'u3',
    userName: 'Harry P.',
    subject: 'Accidental Purchase - Refund Request',
    category: 'Refund',
    description: 'I accidentally bought the E-Book twice. Please refund.',
    status: 'resolved',
    priority: 'medium',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),
    relatedTransactionId: 'tx_3',
    adminResponse: 'Refund processed successfully.'
  }
];

// SPRINT 7: RESOURCES
export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'r1',
    title: 'React Hooks Cheatsheet.pdf',
    type: 'pdf',
    url: '#',
    courseId: 'c1',
    description: 'A quick reference guide for all React Hooks, including custom hook patterns.',
    dateAdded: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
    isLocked: false
  },
  {
    id: 'r2',
    title: 'Potion Ingredients List.docx',
    type: 'doc',
    url: '#',
    courseId: 'c1',
    description: 'Complete list of required ingredients for the semester.',
    dateAdded: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
    isLocked: true
  },
  {
    id: 'r3',
    title: 'Mental Models for Learning',
    type: 'link',
    url: '#',
    description: 'External article on effective learning strategies.',
    dateAdded: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    isLocked: false
  },
  {
    id: 'r4',
    title: 'Course Syllabus 2024',
    type: 'pdf',
    url: '#',
    description: 'General syllabus for all first year students.',
    dateAdded: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    isLocked: false
  }
];
