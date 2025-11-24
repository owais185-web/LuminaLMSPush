
import React, { useState, useEffect } from 'react';
import { Card, Badge, Skeleton, Button, InputField } from '../components/Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ADMIN_STATS } from '../constants';
import { db } from '../services/db';
import { TrendingUp, Users, DollarSign, AlertCircle, CheckCircle2, XCircle, Search, MoreHorizontal, FileText, MessageCircle, Send, Trash2, Plus, Bell, Eye, Clock, Filter, LifeBuoy, RotateCcw, Video, BookOpen, Edit } from 'lucide-react';
import { User, Announcement, Notification, Message, Transaction, Course, SupportTicket } from '../types';

interface AdminDashboardProps {
  view: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ view }) => {
  const [loading, setLoading] = useState(true);
  
  // Persistent State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', audience: 'all' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'student', password: '' });

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Course Management State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Support State
  const [activeSupportTab, setActiveSupportTab] = useState<'tickets' | 'refunds' | 'chat'>('tickets');
  const [resolvingTicket, setResolvingTicket] = useState<SupportTicket | null>(null);
  const [ticketResponse, setTicketResponse] = useState('');

  // Monitoring State
  const [monitoredChannel, setMonitoredChannel] = useState<string>('general');

  // Initialize Data from DB
  useEffect(() => {
      setUsers(db.users.getAll());
      setAnnouncements(db.announcements.getAll());
      setNotifications(db.notifications.getAll().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setAllMessages(db.messages.getAll());
      setTransactions(db.transactions.getAll());
      setCourses(db.courses.getAll());
      setTickets(db.tickets.getAll());
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [view]);

  const handlePostAnnouncement = () => {
    if(!newAnnouncement.title || !newAnnouncement.content) return;
    
    const post: Announcement = {
        id: Date.now().toString(),
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        audience: newAnnouncement.audience as any,
        date: new Date(),
        author: 'Admin Alice'
    };
    
    // Save to DB
    db.announcements.add(post);
    
    // Update Local State
    setAnnouncements(prev => [post, ...prev]);
    setNewAnnouncement({ title: '', content: '', audience: 'all' });
  };

  const handleDeleteAnnouncement = (id: string) => {
      db.announcements.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleCreateUser = () => {
      if (!newUserForm.name || !newUserForm.email || !newUserForm.password) return;
      
      const newUser: User = {
          id: Date.now().toString(),
          name: newUserForm.name,
          email: newUserForm.email,
          role: newUserForm.role as any,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserForm.name)}&background=random&color=fff`,
          password: newUserForm.password
      };

      // Save to DB
      db.users.add(newUser);

      // Update Local State
      setUsers(prev => [...prev, newUser]);
      setIsCreatingUser(false);
      setNewUserForm({ name: '', email: '', role: 'student', password: '' });
  };

  const handleDeleteUser = (userId: string) => {
      if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          db.users.delete(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
      }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      db.users.update(editingUser);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCourse) return;
      db.courses.update(editingCourse);
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? editingCourse : c));
      setEditingCourse(null);
  };

  const handleDeleteCourse = (id: string) => {
      if (confirm("Delete this course?")) {
          db.courses.delete(id);
          setCourses(prev => prev.filter(c => c.id !== id));
      }
  };

  const markNotificationRead = (id: string) => {
      db.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleResolveTicket = () => {
      if (!resolvingTicket) return;
      const updatedTicket: SupportTicket = { 
          ...resolvingTicket, 
          status: 'resolved', 
          adminResponse: ticketResponse 
      };
      db.tickets.update(updatedTicket);
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setResolvingTicket(null);
      setTicketResponse('');
  };

  const handleApproveRefund = (ticket: SupportTicket) => {
      if (!ticket.relatedTransactionId) return;
      if (confirm(`Approve refund for ticket #${ticket.id}? This will reverse transaction ${ticket.relatedTransactionId}.`)) {
          // 1. Refund Transaction
          db.transactions.refund(ticket.relatedTransactionId);
          // 2. Close Ticket
          const closedTicket: SupportTicket = { 
              ...ticket, 
              status: 'closed', 
              adminResponse: 'Refund approved and processed.' 
          };
          db.tickets.update(closedTicket);
          
          // 3. Update State
          setTransactions(prev => prev.map(t => t.id === ticket.relatedTransactionId ? { ...t, status: 'refunded' } : t));
          setTickets(prev => prev.map(t => t.id === closedTicket.id ? closedTicket : t));
      }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // --- VIEW: FINANCIALS ---
  if (view === 'financials') {
    const totalRevenue = transactions.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + t.amount, 0);
    const totalRefunds = transactions.filter(t => t.status === 'refunded').reduce((acc, t) => acc + t.amount, 0);
    const totalPayouts = totalRevenue * 0.7;
    const netProfit = totalRevenue - totalPayouts - totalRefunds;

    return (
       <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <Button variant="secondary" icon={FileText}>Download Report</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
                <p className="text-sm text-slate-500 mb-1">Gross Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</h3>
            </Card>
            <Card className="p-6">
                <p className="text-sm text-slate-500 mb-1">Teacher Payouts (Est.)</p>
                <h3 className="text-3xl font-bold text-slate-900">${totalPayouts.toLocaleString()}</h3>
            </Card>
             <Card className="p-6">
                <p className="text-sm text-slate-500 mb-1">Net Platform Profit</p>
                <h3 className="text-3xl font-bold text-green-600">${netProfit.toLocaleString()}</h3>
            </Card>
        </div>

        <Card title="Recent Transactions">
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                        <tr key={t.id}>
                            <td className="px-6 py-4 font-mono text-slate-500">{t.invoiceId}</td>
                            <td className="px-6 py-4 font-medium">{t.userName}</td>
                            <td className="px-6 py-4 text-slate-900">{t.description}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                            <td className={`px-6 py-4 font-medium ${t.status === 'refunded' ? 'text-red-600' : 'text-green-600'}`}>
                                {t.status === 'refunded' ? '-' : '+'}${t.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                                <Badge color={t.status === 'succeeded' ? 'green' : t.status === 'refunded' ? 'red' : 'yellow'}>
                                    {t.status}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
               </table>
           </div>
        </Card>
       </div>
    );
  }

  // --- VIEW: SUPPORT ---
  if (view === 'support') {
      const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
      const refundTickets = tickets.filter(t => t.category === 'Refund' && t.status === 'open');

      return (
          <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Support Center</h2>
                  <div className="flex gap-2">
                      <Button variant={activeSupportTab === 'tickets' ? 'primary' : 'secondary'} onClick={() => setActiveSupportTab('tickets')} icon={LifeBuoy}>Tickets</Button>
                      <Button variant={activeSupportTab === 'refunds' ? 'primary' : 'secondary'} onClick={() => setActiveSupportTab('refunds')} icon={RotateCcw} className="relative">
                          Refunds
                          {refundTickets.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">{refundTickets.length}</span>}
                      </Button>
                      <Button variant={activeSupportTab === 'chat' ? 'primary' : 'secondary'} onClick={() => setActiveSupportTab('chat')} icon={MessageCircle}>Live Monitor</Button>
                  </div>
              </div>

              {/* TICKET RESPONSE MODAL */}
              {resolvingTicket && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Resolve Ticket #{resolvingTicket.id}</h3>
                        <div className="bg-slate-50 p-3 rounded mb-4 text-sm">
                            <p className="font-bold mb-1">{resolvingTicket.subject}</p>
                            <p className="text-slate-600">{resolvingTicket.description}</p>
                        </div>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-3 h-32 mb-4 text-sm" 
                            placeholder="Type response to user..."
                            value={ticketResponse}
                            onChange={e => setTicketResponse(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setResolvingTicket(null)}>Cancel</Button>
                            <Button onClick={handleResolveTicket}>Send & Resolve</Button>
                        </div>
                    </div>
                  </div>
              )}

              {activeSupportTab === 'tickets' && (
                  <Card title="Ticket Board" className="flex-1 overflow-hidden flex flex-col">
                      <div className="overflow-y-auto flex-1">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                  <tr>
                                      <th className="px-6 py-3">ID</th>
                                      <th className="px-6 py-3">User</th>
                                      <th className="px-6 py-3">Subject</th>
                                      <th className="px-6 py-3">Category</th>
                                      <th className="px-6 py-3">Priority</th>
                                      <th className="px-6 py-3">Status</th>
                                      <th className="px-6 py-3 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {tickets.filter(t => t.category !== 'Refund').map(t => (
                                      <tr key={t.id}>
                                          <td className="px-6 py-4 font-mono text-slate-500">{t.id}</td>
                                          <td className="px-6 py-4">{t.userName}</td>
                                          <td className="px-6 py-4 truncate max-w-[200px]" title={t.subject}>{t.subject}</td>
                                          <td className="px-6 py-4"><Badge color="blue">{t.category}</Badge></td>
                                          <td className="px-6 py-4">
                                              <span className={`text-xs font-bold uppercase ${t.priority === 'high' ? 'text-red-600' : 'text-slate-500'}`}>{t.priority}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <Badge color={t.status === 'resolved' ? 'green' : t.status === 'closed' ? 'gray' : 'yellow'}>{t.status}</Badge>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              {t.status === 'open' && (
                                                  <Button variant="secondary" className="text-xs h-8" onClick={() => setResolvingTicket(t)}>Resolve</Button>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </Card>
              )}

              {activeSupportTab === 'refunds' && (
                  <Card title="Refund Requests Queue" className="flex-1 overflow-hidden flex flex-col">
                      <div className="overflow-y-auto flex-1">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                  <tr>
                                      <th className="px-6 py-3">Ticket ID</th>
                                      <th className="px-6 py-3">User</th>
                                      <th className="px-6 py-3">Amount</th>
                                      <th className="px-6 py-3">Reason</th>
                                      <th className="px-6 py-3">Date</th>
                                      <th className="px-6 py-3 text-right">Decision</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {tickets.filter(t => t.category === 'Refund').map(t => {
                                      const tx = transactions.find(tx => tx.id === t.relatedTransactionId);
                                      return (
                                        <tr key={t.id} className={t.status !== 'open' ? 'opacity-50' : ''}>
                                            <td className="px-6 py-4 font-mono text-slate-500">{t.id}</td>
                                            <td className="px-6 py-4">{t.userName}</td>
                                            <td className="px-6 py-4 font-bold">${tx?.amount.toFixed(2) || 'N/A'}</td>
                                            <td className="px-6 py-4 truncate max-w-[200px]">{t.description}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                {t.status === 'open' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="danger" className="text-xs h-8" onClick={() => setResolvingTicket(t)}>Deny</Button>
                                                        <Button variant="primary" className="text-xs h-8 bg-green-600 hover:bg-green-700" onClick={() => handleApproveRefund(t)}>Approve Refund</Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold">{t.status.toUpperCase()}</span>
                                                )}
                                            </td>
                                        </tr>
                                      );
                                  })}
                              </tbody>
                           </table>
                      </div>
                  </Card>
              )}

              {activeSupportTab === 'chat' && (
                  <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Reusing the Chat Monitor UI from Sprint 4, but integrated here */}
                    <Card className="w-1/3 flex flex-col p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-bold text-slate-700 mb-2">Active Channels</h3>
                            <div className="relative">
                                <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                                <input className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded bg-white" placeholder="Search..." />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <button onClick={() => setMonitoredChannel('general')} className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${monitoredChannel === 'general' ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}>
                                <span className="font-bold text-slate-800"># General Class</span>
                            </button>
                        </div>
                    </Card>
                    <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/50">
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                             <div className="flex items-center gap-2">
                                <MessageCircle className="text-blue-600" />
                                <span className="font-bold text-slate-800">#{monitoredChannel}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                             {allMessages.filter(m => m.channelId === monitoredChannel).map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.senderName.includes('Admin') ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs font-bold text-slate-700 mb-1">{msg.senderName}</span>
                                    <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm shadow-sm ${msg.senderName.includes('Admin') ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>{msg.content}</div>
                                </div>
                             ))}
                        </div>
                    </Card>
                  </div>
              )}
          </div>
      );
  }

  // --- VIEW: COURSE MANAGEMENT ---
  if (view === 'courses') {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                  <Button icon={Plus} onClick={() => {
                      // Simple mock creation for Admin
                      const newC: Course = {
                          id: `c${Date.now()}`, title: 'New Draft Course', instructor: 'TBD', students: 0, revenue: 0, status: 'draft', thumbnail: 'https://picsum.photos/seed/new/400/200', modules: 0, price: 0
                      };
                      setCourses([newC, ...courses]);
                      setEditingCourse(newC);
                  }}>Create Course</Button>
              </div>

              {/* Course Edit Modal */}
              {editingCourse && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Course Details</h3>
                        <form onSubmit={handleUpdateCourse} className="space-y-4">
                            <InputField label="Title" value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Price ($)" type="number" value={editingCourse.price} onChange={e => setEditingCourse({...editingCourse, price: Number(e.target.value)})} />
                                <InputField label="Instructor" value={editingCourse.instructor} onChange={e => setEditingCourse({...editingCourse, instructor: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                    value={editingCourse.status}
                                    onChange={e => setEditingCourse({...editingCourse, status: e.target.value as any})}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setEditingCourse(null)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </div>
                  </div>
              )}

              <Card>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                          <tr>
                              <th className="px-6 py-4">Course</th>
                              <th className="px-6 py-4">Instructor</th>
                              <th className="px-6 py-4">Students</th>
                              <th className="px-6 py-4">Price</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {courses.map(c => (
                              <tr key={c.id}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <img src={c.thumbnail} className="w-10 h-6 object-cover rounded" alt="" />
                                          <span className="font-medium text-slate-900">{c.title}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">{c.instructor}</td>
                                  <td className="px-6 py-4">{c.students}</td>
                                  <td className="px-6 py-4">${c.price}</td>
                                  <td className="px-6 py-4"><Badge color={c.status === 'published' ? 'green' : 'yellow'}>{c.status}</Badge></td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => setEditingCourse(c)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={18}/></button>
                                          <button onClick={() => handleDeleteCourse(c.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </Card>
          </div>
      );
  }

  // --- VIEW: ANNOUNCEMENTS ---
  if (view === 'announcements') {
      return (
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Platform Announcements</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Composer */}
                  <div className="lg:col-span-1">
                      <Card title="New Announcement" className="sticky top-24">
                          <div className="space-y-4">
                              <InputField 
                                label="Title" 
                                value={newAnnouncement.title}
                                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                placeholder="e.g., System Maintenance"
                              />
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
                                  <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white"
                                    value={newAnnouncement.audience}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, audience: e.target.value})}
                                  >
                                      <option value="all">All Users</option>
                                      <option value="students">Students Only</option>
                                      <option value="teachers">Teachers Only</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                  <textarea 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none h-32" 
                                    placeholder="Write your message..." 
                                    value={newAnnouncement.content}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                  />
                              </div>
                              <Button className="w-full" icon={Send} onClick={handlePostAnnouncement}>Post Announcement</Button>
                          </div>
                      </Card>
                  </div>

                  {/* Feed */}
                  <div className="lg:col-span-2 space-y-4">
                      {announcements.map(item => (
                          <Card key={item.id}>
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                                      <p className="text-xs text-slate-500">
                                          Posted by {item.author} • {new Date(item.date).toLocaleDateString()}
                                      </p>
                                  </div>
                                  <Badge color="blue" >{item.audience}</Badge>
                              </div>
                              <p className="text-slate-600 mb-4">{item.content}</p>
                              <div className="flex justify-end border-t border-slate-100 pt-2">
                                  <button onClick={() => handleDeleteAnnouncement(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </Card>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: USER MANAGEMENT ---
  if (view === 'users') {
    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <div className="flex gap-3">
            <Button icon={Plus} onClick={() => setIsCreatingUser(true)}>Create User</Button>
          </div>
        </div>
        
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Search by name or email..." 
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
            />
        </div>

        {/* Create User Modal */}
        {isCreatingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Create New User</h3>
                        <button onClick={() => setIsCreatingUser(false)} className="text-slate-400 hover:text-slate-600">
                            <XCircle size={24} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <InputField 
                            label="Full Name" 
                            placeholder="e.g. Hermione Granger" 
                            value={newUserForm.name}
                            onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                        />
                        <InputField 
                            label="Email Address" 
                            type="email"
                            placeholder="e.g. h.granger@hogwarts.edu" 
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                        />
                         <InputField 
                            label="Temporary Password" 
                            type="password"
                            placeholder="Create a strong password" 
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                value={newUserForm.role}
                                onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                             <Button variant="secondary" className="flex-1" onClick={() => setIsCreatingUser(false)}>Cancel</Button>
                             <Button className="flex-1" onClick={handleCreateUser} disabled={!newUserForm.password}>Create Account</Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Edit User</h3>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                         <InputField label="Full Name" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                         <InputField label="Email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                value={editingUser.role}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingUser(null)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Save Changes</Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <Card>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                      <div>
                          <span className="font-medium text-slate-900 block">{user.name}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4"><Badge color="green">Active</Badge></td>
                  <td className="px-6 py-4 text-slate-500">Oct 24, 2023</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingUser(user)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={18}/></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // --- VIEW: DEFAULT (OVERVIEW) ---
  // Calculate basic stats for overview cards based on real transaction data if available, else fallback
  const currentRevenue = transactions.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + t.amount, 0);
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Platform Overview</h2>
            <p className="text-slate-500">Real-time monitor of enrollment, revenue, and critical alerts.</p>
        </div>
        <div className="text-right">
            <Badge color="green">System Operational</Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
              <h4 className="text-2xl font-bold text-slate-900">${currentRevenue > 0 ? currentRevenue.toLocaleString() : '224,000'}</h4>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Students</p>
              <h4 className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'student').length}</h4>
            </div>
          </div>
        </Card>

         <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Courses</p>
              <h4 className="text-2xl font-bold text-slate-900">{courses.filter(c => c.status === 'published').length}</h4>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Open Tickets</p>
              <h4 className="text-2xl font-bold text-slate-900">{openTicketsCount}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Items Table (Notifications) */}
      <Card title="Recent Alerts">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.slice(0, 4).map(n => (
                <tr key={n.id} className={n.isRead ? 'opacity-50' : ''}>
                   <td className="px-4 py-3">
                       <Badge color={n.type === 'alert' ? 'red' : 'blue'}>{n.type}</Badge>
                   </td>
                   <td className="px-4 py-3 font-medium text-slate-900">{n.message}</td>
                   <td className="px-4 py-3 text-slate-500">{new Date(n.timestamp).toLocaleTimeString()}</td>
                   <td className="px-4 py-3 text-right">
                        {!n.isRead && <button onClick={() => markNotificationRead(n.id)} className="text-blue-600 hover:underline text-xs">Mark Read</button>}
                   </td>
                </tr>
              ))}
              {notifications.length === 0 && <tr><td colSpan={4} className="px-4 py-3 text-center text-slate-400 italic">No recent alerts</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADMIN_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Weekly Enrollments">
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ADMIN_STATS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};