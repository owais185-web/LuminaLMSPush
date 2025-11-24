
import React, { useEffect, useState } from 'react';
import { Card, Button, Skeleton, Badge, InputField } from '../components/Common';
import { CoursePlayer } from '../components/CoursePlayer';
import { PaymentModal } from '../components/PaymentModal';
import { db } from '../services/db';
import { paymentService } from '../services/paymentService';
import { PlayCircle, Clock, Calendar, CheckCircle2, MessageSquare, PauseCircle, XCircle, Sparkles, Download, CreditCard, LifeBuoy, Send, Video, Search, Filter, BookOpen, Lock, Check, AlertTriangle, FileText, RotateCcw, HelpCircle, Library, Save, ExternalLink, Star, Pause } from 'lucide-react';
import { generateDailyQuote } from '../services/geminiService';
import { Course, LiveClass, User, Transaction, SupportTicket, Resource } from '../types';

interface StudentDashboardProps {
    view: string;
    currentUser: User;
    onUserUpdate: (user: User) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ view, currentUser, onUserUpdate }) => {
  const [nextClass, setNextClass] = useState<LiveClass | null>(null);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dailyWisdom, setDailyWisdom] = useState<{text: string, source: string} | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingEnrollCourse, setPendingEnrollCourse] = useState<Course | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [autoPayLoading, setAutoPayLoading] = useState(false);
  const [subscriptionStatusLoading, setSubscriptionStatusLoading] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);

  // Functional States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'enrolled' | 'draft'>('all');
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Technical Issue', description: '' });
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [calSyncStatus, setCalSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  
  // Reflection State
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // Refund Modal
  const [refundModal, setRefundModal] = useState<{isOpen: boolean, transactionId: string, amount: number} | null>(null);

  // Reschedule State
  const [rescheduleModal, setRescheduleModal] = useState<{isOpen: boolean, classId: string, date: string, time: string}>({ isOpen: false, classId: '', date: '', time: '' });
  const [actionMessage, setActionMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const teacherAvatar = "https://picsum.photos/seed/teacher/200";

  useEffect(() => {
    const init = async () => {
       setLoading(true);
       // Fetch from DB
       const dbClasses = db.classes.getAll().sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
       const dbCourses = db.courses.getAll();
       
       setClasses(dbClasses);
       // Find next upcoming class
       const upcoming = dbClasses.find(c => new Date(c.startTime) > new Date() && c.status !== 'cancelled');
       setNextClass(upcoming || null);
       
       setAllCourses(dbCourses);
       setTransactions(db.transactions.getByUser(currentUser.id));
       setMyTickets(db.tickets.getAll().filter(t => t.userId === currentUser.id));
       setResources(db.resources.getAll());

       const quote = await generateDailyQuote();
       setDailyWisdom(quote);
       setLoading(false);
    };
    
    init();

    const timer = setInterval(() => {
        if (!nextClass) return;
        const now = new Date();
        const diff = new Date(nextClass.startTime).getTime() - now.getTime();
        
        if (diff <= 0) {
            setTimeLeft("Live Now");
        } else {
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            setTimeLeft(`${hours}h ${minutes}m`);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextClass, currentUser.id]);

  const handleEnrollClick = (course: Course) => {
      if (course.price > 0) {
          setPendingEnrollCourse(course);
          setPaymentModalOpen(true);
      } else {
          completeEnrollment(course.id);
      }
  };

  const completeEnrollment = (courseId: string) => {
    const updatedUser = db.users.enroll(currentUser.id, courseId);
    if (updatedUser) {
        onUserUpdate(updatedUser);
    }
    setPaymentModalOpen(false);
    setPendingEnrollCourse(null);
    alert("Successfully enrolled!");
  };

  const handleJoinClass = (cls: LiveClass) => {
      const updatedClass = db.classes.markAttendance(cls.id, currentUser.id);
      setClasses(prev => prev.map(c => c.id === cls.id ? updatedClass! : c));
      const link = cls.zoomDetails?.joinUrl || cls.meetingLink;
      if (link) window.open(link, '_blank');
      else alert("Class link is unavailable. Please contact support.");
  };

  const handleStudentCancel = (id: string) => {
      if (confirm("Are you sure you want to withdraw from this session?")) {
          const result = db.classes.cancel(id, 'student', currentUser.name);
          if (result.success) setActionMessage({ type: 'success', text: 'You have withdrawn from the session.' });
          else setActionMessage({ type: 'error', text: result.error || 'Error' });
      }
  };

  const handleRescheduleRequest = () => {
      if (!rescheduleModal.date || !rescheduleModal.time) return;
      const newStart = new Date(`${rescheduleModal.date}T${rescheduleModal.time}`);
      const result = db.classes.reschedule(rescheduleModal.classId, newStart, 'student', currentUser.name);
      if (result.success) {
          setActionMessage({ type: 'success', text: result.error || 'Request sent to admin.' });
          setRescheduleModal({ isOpen: false, classId: '', date: '', time: '' });
      } else {
          setActionMessage({ type: 'error', text: result.error || 'Failed' });
      }
  };

  const toggleAutoPayment = () => {
      setAutoPayLoading(true);
      setTimeout(() => {
          const newStatus = !currentUser.billing?.autoPaymentEnabled;
          const updated = { ...currentUser, billing: { ...currentUser.billing, autoPaymentEnabled: newStatus } };
          db.users.update(updated as User);
          onUserUpdate(updated as User);
          setAutoPayLoading(false);
      }, 800);
  };

  const changeSubscriptionStatus = (status: 'paused' | 'cancelled') => {
      if (!confirm(status === 'paused' 
          ? "Pause your classes? You won't be billed until you resume." 
          : "Are you sure you want to cancel your subscription?"
      )) return;

      setSubscriptionStatusLoading(true);
      setTimeout(() => {
          const updated = { 
              ...currentUser, 
              billing: { 
                  ...currentUser.billing, 
                  status: status, 
                  autoPaymentEnabled: false 
              } 
          };
          db.users.update(updated as User);
          onUserUpdate(updated as User);
          setSubscriptionStatusLoading(false);
          alert(status === 'paused' ? "Subscription paused." : "Subscription cancelled.");
      }, 1000);
  };

  const handleDownloadInvoice = (t: Transaction) => {
      const url = paymentService.generateInvoicePDF(t);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t.invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleSaveReflection = () => {
      setIsSavingReflection(true);
      setTimeout(() => {
          setIsSavingReflection(false);
          setReflectionText('');
          alert("Reflection saved! Keep up the great work.");
      }, 1000);
  };

  const isEnrolled = (courseId: string) => currentUser.enrolledCourses?.includes(courseId);

  // Actions
  const handleSyncCalendar = () => {
      setCalSyncStatus('syncing');
      setTimeout(() => {
          setCalSyncStatus('synced');
          setTimeout(() => setCalSyncStatus('idle'), 3000);
      }, 1500);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
      e.preventDefault();
      if (!ticketForm.subject || !ticketForm.description) return;
      setTicketStatus('sending');
      
      const newTicket: SupportTicket = {
          id: `t${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          subject: ticketForm.subject,
          category: ticketForm.category as any,
          description: ticketForm.description,
          status: 'open',
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
      };

      setTimeout(() => {
          db.tickets.add(newTicket);
          setMyTickets(prev => [newTicket, ...prev]);
          setTicketStatus('success');
          setTicketForm({ subject: '', category: 'Technical Issue', description: '' });
          setTimeout(() => setTicketStatus('idle'), 3000);
      }, 1500);
  };

  const handleSubmitRefund = (reason: string) => {
      if (!refundModal) return;
      
      const ticket: SupportTicket = {
          id: `t${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          subject: `Refund Request: $${refundModal.amount}`,
          category: 'Refund',
          description: reason,
          status: 'open',
          priority: 'high',
          createdAt: new Date(),
          updatedAt: new Date(),
          relatedTransactionId: refundModal.transactionId
      };

      db.tickets.add(ticket);
      setMyTickets(prev => [ticket, ...prev]);
      setRefundModal(null);
      alert("Refund request submitted. Our team will review it shortly.");
  };

  // Helper for ratings
  const getRating = (course: Course) => {
      if (!course.reviews || course.reviews.length === 0) return 0;
      const total = course.reviews.reduce((acc, r) => acc + r.rating, 0);
      return total / course.reviews.length;
  };

  // Derived Data
  const filteredCourses = allCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' ? true : 
                            activeFilter === 'enrolled' ? isEnrolled(course.id) : true;
      return matchesSearch && matchesFilter;
  });

  if (selectedCourse) {
      return <CoursePlayer course={selectedCourse} onBack={() => setSelectedCourse(null)} user={currentUser} />;
  }

  if (loading) return <div className="p-8 space-y-6"><Skeleton className="h-64 w-full" /><div className="grid grid-cols-2 gap-6"><Skeleton className="h-40" /><Skeleton className="h-40" /></div></div>;

  return (
    <>
      {/* Global Payment Modal */}
      {paymentModalOpen && pendingEnrollCourse && (
          <PaymentModal 
             amount={pendingEnrollCourse.price} 
             description={`Enrollment: ${pendingEnrollCourse.title}`}
             userId={currentUser.id}
             onSuccess={() => completeEnrollment(pendingEnrollCourse.id)}
             onClose={() => setPaymentModalOpen(false)}
          />
      )}

      {refundModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Request Refund</h3>
                    <p className="text-sm text-slate-500 mb-4">You are requesting a refund of ${refundModal.amount}. Refunds are typically processed within 3-5 business days.</p>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSubmitRefund(formData.get('reason') as string);
                    }}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for refund</label>
                        <textarea name="reason" className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4" rows={3} required placeholder="E.g., Accidental purchase, course not as described..."></textarea>
                        <div className="flex gap-2">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => setRefundModal(null)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Submit Request</Button>
                        </div>
                    </form>
                </div>
           </div>
      )}

      {view === 'browse' && (
          <div className="space-y-8">
              {/* Rolling Poster Carousel */}
              <div className="relative w-full overflow-hidden -mx-4 px-4 md:mx-0 md:px-0">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Featured Courses</h2>
                  <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                      {allCourses.slice(0, 4).map(course => (
                          <div key={course.id} className="snap-center shrink-0 w-[300px] md:w-[400px] h-[240px] rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg hover:shadow-xl transition-all" onClick={() => setSelectedCourse(course)}>
                              <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={course.title} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                  <div className="flex gap-2 mb-2">
                                      <Badge color="blue">{course.students} Students</Badge>
                                      {getRating(course) > 0 && <Badge color="yellow">★ {getRating(course).toFixed(1)}</Badge>}
                                  </div>
                                  <h3 className="text-white font-bold text-xl mb-1">{course.title}</h3>
                                  <p className="text-slate-300 text-sm line-clamp-1">{course.instructor}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-slate-200 pt-6">
                  <h2 className="text-2xl font-bold text-slate-900">All Courses</h2>
                  <div className="flex gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:flex-none md:w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            placeholder="Search topics..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                      </div>
                      <Button 
                        variant={activeFilter === 'enrolled' ? 'primary' : 'secondary'} 
                        icon={Filter} 
                        onClick={() => setActiveFilter(activeFilter === 'all' ? 'enrolled' : 'all')}
                      >
                        {activeFilter === 'enrolled' ? 'Enrolled' : 'All'}
                      </Button>
                  </div>
              </div>

              {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                      <p className="text-slate-500">No courses found matching your criteria.</p>
                      <button onClick={() => {setSearchQuery(''); setActiveFilter('all')}} className="text-blue-600 hover:underline text-sm mt-2">Clear filters</button>
                  </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => {
                        const enrolled = isEnrolled(course.id);
                        const rating = getRating(course);
                        return (
                        <Card key={course.id} className="flex flex-col h-full">
                            <div className="relative">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover -mx-6 -mt-6 mb-4 rounded-t-xl" />
                                {enrolled && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Enrolled
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge color="blue">Development</Badge>
                                    <span className="font-bold text-slate-900">${course.price}</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{course.title}</h3>
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < Math.round(rating) ? "text-yellow-400 fill-current" : "text-slate-300"} />
                                    ))}
                                    <span className="text-xs text-slate-500 ml-1">({course.reviews?.length || 0})</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                    <span className="flex items-center gap-1"><Clock size={14}/> 12h 30m</span>
                                    <span>•</span>
                                    <span>{course.modules} Modules</span>
                                </div>
                            </div>
                            
                            {enrolled ? (
                                <Button 
                                        className="w-full mt-auto" 
                                        variant="secondary"
                                        onClick={() => setSelectedCourse(course)}
                                    >
                                        Go to Course
                                    </Button>
                            ) : (
                                    <Button 
                                        className="w-full mt-auto" 
                                        onClick={() => handleEnrollClick(course)}
                                    >
                                        Enroll Now
                                    </Button>
                            )}
                        </Card>
                    )})}
                </div>
              )}
          </div>
      )}

      {view === 'resources' && (
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Library className="text-blue-600" /> Reflections & Resources
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Weekly Reflection Prompt */}
                  <div className="lg:col-span-2">
                      <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-10">
                               <Sparkles size={120} className="text-indigo-600" />
                           </div>
                           <div className="relative z-10">
                               <div className="flex items-center gap-2 mb-4">
                                   <Badge color="blue">Weekly Prompt</Badge>
                                   <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Oct 23 - Oct 30</span>
                               </div>
                               <h3 className="text-2xl font-bold text-slate-800 mb-2">Reflecting on Challenges</h3>
                               <p className="text-slate-600 mb-6 text-lg">
                                   What was the most difficult concept you encountered this week, and what strategies did you use to overcome it?
                               </p>
                               <textarea 
                                    className="w-full p-4 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none h-32 shadow-sm resize-none"
                                    placeholder="Write your reflection here..."
                                    value={reflectionText}
                                    onChange={e => setReflectionText(e.target.value)}
                               ></textarea>
                               <div className="flex justify-end mt-4">
                                   <Button icon={Save} onClick={handleSaveReflection} isLoading={isSavingReflection} disabled={!reflectionText}>
                                       Save Reflection
                                   </Button>
                               </div>
                           </div>
                      </Card>

                      <div className="mt-8">
                          <h3 className="text-lg font-bold text-slate-900 mb-4">Downloadable Resources</h3>
                          <div className="grid gap-4">
                              {resources.map(res => (
                                  <div key={res.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                                          res.type === 'pdf' ? 'bg-red-50 text-red-500' : 
                                          res.type === 'doc' ? 'bg-blue-50 text-blue-500' : 
                                          'bg-slate-100 text-slate-500'
                                      }`}>
                                          <FileText size={24} />
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{res.title}</h4>
                                          <p className="text-sm text-slate-500">{res.description}</p>
                                          <div className="flex gap-2 mt-1">
                                             {res.courseId && <Badge color="yellow">Course Specific</Badge>}
                                             <span className="text-xs text-slate-400 pt-0.5">{new Date(res.dateAdded).toLocaleDateString()}</span>
                                          </div>
                                      </div>
                                      <Button variant="secondary" icon={res.type === 'link' ? ExternalLink : Download}>
                                          {res.type === 'link' ? 'Open' : 'Download'}
                                      </Button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                      <Card title="My Progress">
                          <div className="text-center py-6">
                               <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-8 border-blue-100 mb-4">
                                   <span className="text-2xl font-bold text-blue-600">3/5</span>
                               </div>
                               <p className="font-bold text-slate-800">Reflections Completed</p>
                               <p className="text-sm text-slate-500">You're on a 3-week streak!</p>
                          </div>
                      </Card>
                  </div>
              </div>
          </div>
      )}

      {view === 'billing' && (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Billing & Invoices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Subscription & Billing">
                     <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg mb-4">
                        <CreditCard className="text-blue-600" />
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Visa ending in {currentUser.billing?.savedCardLast4 || '****'}</p>
                            <p className="text-xs text-slate-500">Expires 12/25</p>
                        </div>
                        <Badge color="blue">Default</Badge>
                     </div>
                     
                     {/* Status Note */}
                     <div className="mb-4">
                         {currentUser.billing?.status === 'paused' ? (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
                                 <PauseCircle size={18} />
                                 <span>Classes will resume after the next successful payment inshaAllah.</span>
                             </div>
                         ) : currentUser.billing?.status === 'cancelled' ? (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
                                 <XCircle size={18} />
                                 <span>Subscription cancelled. Access will end soon.</span>
                             </div>
                         ) : (
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                 <div>
                                     <p className="font-semibold text-sm text-slate-800">Auto-Renewal</p>
                                     <p className="text-xs text-slate-500">Next billing date: {new Date(currentUser.billing?.subscriptionEnd || Date.now()).toLocaleDateString()}</p>
                                 </div>
                                 <button 
                                    onClick={toggleAutoPayment} 
                                    disabled={autoPayLoading}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentUser.billing?.autoPaymentEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${currentUser.billing?.autoPaymentEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                 </button>
                             </div>
                         )}
                     </div>

                     {/* Management Buttons */}
                     <div className="flex flex-col gap-2">
                         {(currentUser.billing?.status === 'active' || !currentUser.billing?.status) && (
                             <div className="flex gap-2">
                                 <Button 
                                    variant="secondary" 
                                    className="w-full justify-center border-yellow-200 text-yellow-700 hover:bg-yellow-50" 
                                    icon={Pause}
                                    onClick={() => changeSubscriptionStatus('paused')}
                                    isLoading={subscriptionStatusLoading}
                                 >
                                     Pause Subscription
                                 </Button>
                                 <Button 
                                    variant="secondary" 
                                    className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50" 
                                    icon={XCircle}
                                    onClick={() => changeSubscriptionStatus('cancelled')}
                                    isLoading={subscriptionStatusLoading}
                                 >
                                     Cancel
                                 </Button>
                             </div>
                         )}
                          {(currentUser.billing?.status === 'paused' || currentUser.billing?.status === 'cancelled') && (
                              <Button className="w-full justify-center" onClick={() => alert("Redirecting to payment to resume...")}>Resume Subscription</Button>
                          )}
                     </div>
                </Card>

                <Card title="Invoice History">
                    <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 truncate max-w-[120px]">{t.description}</td>
                                        <td className="px-4 py-3 font-medium">
                                            <span className={t.status === 'refunded' ? 'line-through text-slate-400' : ''}>${t.amount.toFixed(2)}</span>
                                            {t.status === 'refunded' && <span className="text-xs text-red-500 block">Refunded</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDownloadInvoice(t)}
                                                    className="text-slate-500 hover:text-blue-600"
                                                    title="Download Invoice"
                                                >
                                                    <Download size={14}/>
                                                </button>
                                                {t.status === 'succeeded' && (new Date().getTime() - new Date(t.date).getTime() < 1000 * 60 * 60 * 24 * 30) && (
                                                    <button 
                                                        onClick={() => setRefundModal({ isOpen: true, transactionId: t.id, amount: t.amount })}
                                                        className="text-slate-400 hover:text-red-500 text-xs underline"
                                                        title="Request Refund"
                                                    >
                                                        Refund
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-4 text-slate-400 italic">No transactions yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
      )}

      {view === 'schedule' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Class Schedule</h2>
                  <Button 
                    variant="secondary" 
                    icon={calSyncStatus === 'synced' ? Check : Calendar} 
                    onClick={handleSyncCalendar}
                    className={calSyncStatus === 'synced' ? 'text-green-600 bg-green-50 border-green-200' : ''}
                    isLoading={calSyncStatus === 'syncing'}
                  >
                    {calSyncStatus === 'synced' ? 'Synced!' : 'Sync to Calendar'}
                  </Button>
              </div>

              {actionMessage && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${actionMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {actionMessage.type === 'success' ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
                      {actionMessage.text}
                      <button onClick={() => setActionMessage(null)} className="ml-auto"><XCircle size={16}/></button>
                  </div>
              )}

              {rescheduleModal.isOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Request Reschedule</h3>
                        <p className="text-sm text-slate-500 mb-4">Requests must be made at least 4 hours in advance.</p>
                        <div className="space-y-4">
                            <InputField 
                                label="Preferred Date" 
                                type="date" 
                                value={rescheduleModal.date}
                                onChange={e => setRescheduleModal({...rescheduleModal, date: e.target.value})}
                            />
                             <InputField 
                                label="Preferred Time" 
                                type="time" 
                                value={rescheduleModal.time}
                                onChange={e => setRescheduleModal({...rescheduleModal, time: e.target.value})}
                            />
                            <div className="flex gap-2 pt-2">
                                <Button variant="secondary" className="flex-1" onClick={() => setRescheduleModal({...rescheduleModal, isOpen: false})}>Cancel</Button>
                                <Button className="flex-1" onClick={handleRescheduleRequest}>Send Request</Button>
                            </div>
                        </div>
                    </div>
                  </div>
              )}

              <div className="grid gap-4">
                  {classes.length === 0 && <p className="text-slate-500 italic">No scheduled classes.</p>}
                  {classes.map((cls) => {
                      const startTime = new Date(cls.startTime);
                      const hasAttended = cls.attendees?.includes(currentUser.id);
                      const isCancelled = cls.status === 'cancelled';

                      return (
                        <Card key={cls.id} className={`flex flex-col md:flex-row md:items-center gap-6 p-6 ${isCancelled ? 'border-l-4 border-l-red-500 opacity-70' : 'border-l-4 border-l-blue-500'}`}>
                            <div className={`flex flex-col items-center justify-center rounded-xl p-4 min-w-[100px] ${isCancelled ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-700'}`}>
                                    <span className="text-2xl font-bold">{startTime.getDate()}</span>
                                    <span className="text-xs font-bold uppercase">{startTime.toLocaleDateString('en-US', { month: 'short' })}</span>
                                    <span className="text-xs opacity-75">{startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-lg font-bold text-slate-900 ${isCancelled ? 'line-through' : ''}`}>{cls.title}</h3>
                                {isCancelled && <Badge color="red">Cancelled</Badge>}
                                <p className="text-slate-500 flex items-center gap-2 text-sm mt-1">
                                    <Clock size={14} /> {cls.durationMinutes} minutes • Prof. Snape
                                </p>
                                {hasAttended && <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> You attended this class</p>}
                                
                                {!isCancelled && (
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => setRescheduleModal({ isOpen: true, classId: cls.id, date: '', time: '' })} className="text-xs text-blue-600 hover:underline">Reschedule</button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={() => handleStudentCancel(cls.id)} className="text-xs text-red-500 hover:underline">Withdraw</button>
                                    </div>
                                )}
                            </div>
                            {!isCancelled && (
                                <Button 
                                    icon={Video} 
                                    onClick={() => handleJoinClass(cls)}
                                    variant={hasAttended ? 'secondary' : 'primary'}
                                >
                                    {hasAttended ? 'Join Again' : 'Join Class'}
                                </Button>
                            )}
                        </Card>
                      );
                  })}
              </div>
          </div>
      )}

      {view === 'support' && (
        <div className="space-y-6 max-w-4xl mx-auto relative">
             {/* WhatsApp Floating Button */}
             <div className="fixed bottom-6 left-6 z-40">
                 <a 
                   href="https://wa.me/1234567890" 
                   target="_blank" 
                   rel="noreferrer"
                   className="flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 hover:scale-105 transition-all"
                   title="Chat on WhatsApp"
                 >
                     <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                     </svg>
                 </a>
             </div>

             <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><LifeBuoy className="text-blue-600"/> Help & Support</h2>
             </div>
             
             {ticketStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={24} />
                    <div>
                        <h4 className="font-bold">Ticket Received!</h4>
                        <p className="text-sm">Our team will review your request and get back to you shortly.</p>
                    </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card title="Submit a Ticket">
                        <form onSubmit={handleSubmitTicket} className="space-y-4">
                            <InputField 
                                label="Subject" 
                                placeholder="e.g., Trouble accessing course content"
                                value={ticketForm.subject}
                                onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                                    value={ticketForm.category}
                                    onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                                >
                                    <option>Technical Issue</option>
                                    <option>Billing</option>
                                    <option>Course Content</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none h-32" 
                                    placeholder="Describe your issue..."
                                    value={ticketForm.description}
                                    onChange={e => setTicketForm({...ticketForm, description: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button icon={Send} type="submit" isLoading={ticketStatus === 'sending'}>Submit Ticket</Button>
                            </div>
                        </form>
                    </Card>

                    <Card title="My Support History">
                        <div className="space-y-2">
                            {myTickets.length === 0 && <p className="text-slate-500 italic">No past tickets.</p>}
                            {myTickets.map(t => (
                                <div key={t.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 text-sm">{t.subject}</h4>
                                        <Badge color={t.status === 'resolved' ? 'green' : 'yellow'}>{t.status}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 truncate">{t.description}</p>
                                    {t.adminResponse && (
                                        <div className="mt-2 text-xs bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                                            <strong>Admin:</strong> {t.adminResponse}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-4">
                    <Card className="bg-blue-50 border-blue-100">
                         <h3 className="font-bold text-blue-900 mb-2">Knowledge Base</h3>
                         <div className="space-y-2">
                             <div className="p-2 bg-white rounded border border-blue-100 text-sm text-slate-700 cursor-pointer hover:shadow-sm flex items-center gap-2">
                                 <HelpCircle size={16} className="text-blue-500" /> How to reset password?
                             </div>
                             <div className="p-2 bg-white rounded border border-blue-100 text-sm text-slate-700 cursor-pointer hover:shadow-sm flex items-center gap-2">
                                 <HelpCircle size={16} className="text-blue-500" /> Course refund policy
                             </div>
                             <div className="p-2 bg-white rounded border border-blue-100 text-sm text-slate-700 cursor-pointer hover:shadow-sm flex items-center gap-2">
                                 <HelpCircle size={16} className="text-blue-500" /> Video playback issues
                             </div>
                         </div>
                    </Card>
                    <Card className="text-center p-6 hover:bg-slate-50 cursor-pointer transition-colors">
                        <MessageSquare className="mx-auto text-green-500 mb-2" size={28} />
                        <h4 className="font-bold text-slate-900">Live Chat</h4>
                        <p className="text-xs text-slate-500">Available 9am - 5pm</p>
                    </Card>
                </div>
             </div>
        </div>
      )}

      {view === 'learning' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Greeting & Wisdom */}
          <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
              {dailyWisdom && (
                  <div className="mt-2 flex items-start gap-2 text-slate-600 bg-white/50 p-3 rounded-lg border border-slate-100 inline-block animate-in fade-in duration-700">
                      <Sparkles size={16} className="text-yellow-500 mt-1 shrink-0" />
                      <p className="italic text-sm">"{dailyWisdom.text}" <span className="font-semibold not-italic text-slate-400 ml-1">— {dailyWisdom.source}</span></p>
                  </div>
              )}
          </div>

          {/* Hero Section: Next Action */}
          {nextClass && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold uppercase rounded animate-pulse">Up Next</span>
                            <span className="text-blue-100 text-sm font-medium flex items-center gap-1"><Clock size={14}/> Starts in {timeLeft}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{nextClass.title}</h1>
                        <p className="text-blue-100 text-lg">with Prof. Snape • {nextClass.durationMinutes} mins</p>
                    </div>
                    <div className="flex-shrink-0">
                        <Button 
                            className="bg-white text-blue-600 hover:bg-blue-50 border-none text-lg px-8 py-4 shadow-xl hover:scale-105 transition-transform"
                            onClick={() => handleJoinClass(nextClass)}
                        >
                            Join Class Now
                        </Button>
                        <p className="text-[10px] text-blue-200 text-center mt-2">Attendance marked automatically</p>
                    </div>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Feedback */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-500"/> My Enrolled Courses
                </h3>
                
                {allCourses.filter(c => isEnrolled(c.id)).length === 0 && (
                    <Card className="text-center py-10 border-dashed">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BookOpen className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700">No courses yet</h3>
                        <p className="text-slate-500 mb-4">Browse our catalog to find your next skill.</p>
                        {/* Assuming a simple view change function or context wasn't fully exposed in props, using no-op or prop if existed */}
                    </Card>
                )}

                {allCourses.filter(c => isEnrolled(c.id)).map((course, idx) => (
                    <Card key={course.id} className="flex flex-col md:flex-row gap-6 items-center p-2">
                        <img src={course.thumbnail} className="w-full md:w-40 h-24 object-cover rounded-lg" alt={course.title} />
                        <div className="flex-1 w-full">
                            <div className="flex justify-between mb-1">
                                <h4 className="font-bold text-slate-900">{course.title}</h4>
                                <span className="text-sm text-slate-500">30%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                            <p className="text-xs text-slate-500">Next: Module 2: Advanced Patterns</p>
                        </div>
                        <Button 
                            variant="secondary" 
                            icon={PlayCircle} 
                            className="shrink-0"
                            onClick={() => setSelectedCourse(course)}
                        >
                            Resume
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
                {/* Teacher Note */}
                <Card className="bg-yellow-50 border-yellow-100">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-full shadow-sm">
                            <MessageSquare size={20} className="text-yellow-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">Feedback</h4>
                            <p className="text-sm text-slate-800 italic mb-3">
                                "Great job on the last assignment, Harry! Your use of custom hooks was very clean."
                            </p>
                            <div className="flex items-center gap-2">
                                <img src={teacherAvatar} className="w-6 h-6 rounded-full" alt="Prof" />
                                <span className="text-xs font-bold text-slate-600">Prof. Snape</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
