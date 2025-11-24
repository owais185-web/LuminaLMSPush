import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Menu,
  X,
  GraduationCap,
  Video,
  LifeBuoy,
  CreditCard,
  Search,
  Megaphone,
  Library
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onChangeRole: (role: UserRole) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout, 
  onChangeRole, 
  currentView,
  onViewChange,
  children 
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = {
    admin: [
      { id: 'overview', label: 'Platform Health', icon: LayoutDashboard },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'financials', label: 'Financials & Refunds', icon: CreditCard },
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
      { id: 'support', label: 'Support Tickets', icon: LifeBuoy },
    ],
    teacher: [
      { id: 'courses', label: 'My Courses', icon: BookOpen },
      { id: 'schedule', label: 'Live Schedule', icon: Video },
      { id: 'progress', label: 'Student Progress', icon: Users },
    ],
    student: [
      { id: 'learning', label: 'My Learning', icon: GraduationCap },
      { id: 'browse', label: 'Browse Courses', icon: Search },
      { id: 'schedule', label: 'Class Schedule', icon: Video },
      { id: 'resources', label: 'Resources', icon: Library },
      { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
      { id: 'support', label: 'Help & Support', icon: LifeBuoy },
    ]
  };

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setSidebarOpen(false); // Close mobile menu on selection
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#f0f4f9] p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-xl text-[#444746]">
          <span className="text-blue-600">Lumina</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 bg-white rounded-full shadow-sm">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Navigation Drawer (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-72 bg-[#f0f4f9] p-4 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen sticky top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="hidden md:flex items-center gap-3 px-4 mb-8 mt-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">L</div>
            <span className="font-normal text-2xl text-[#444746]">Lumina</span>
          </div>

          {/* User Card - Material Card */}
          <div className="mb-6 mx-0">
            <button className="w-full bg-white rounded-full p-1 pl-2 pr-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left">
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{user.role}</p>
                </div>
            </button>
          </div>

          {/* Nav Items - Pills */}
          <nav className="flex-1 space-y-1">
            {navItems[user.role].map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800 font-medium' 
                      : 'text-[#444746] hover:bg-[#e0e3e7] font-normal'
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm tracking-wide">{item.label}</span>
                </button>
              );
            })}
            
            <div className="my-4 border-t border-slate-200 mx-4"></div>

            <button 
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-full transition-all duration-200 ${
                currentView === 'settings'
                 ? 'bg-blue-100 text-blue-800 font-medium'
                 : 'text-[#444746] hover:bg-[#e0e3e7] font-normal'
              }`}
            >
              <Settings size={22} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
              <span className="text-sm tracking-wide">Settings</span>
            </button>
          </nav>

          <div className="pt-4">
             {/* Role Switcher Hidden Logic Preserved */}
             <div className="mb-4 hidden"> 
                <button onClick={() => onChangeRole('admin')}>A</button>
                <button onClick={() => onChangeRole('teacher')}>T</button>
                <button onClick={() => onChangeRole('student')}>S</button>
             </div>

            <button onClick={onLogout} className="flex items-center gap-4 px-6 py-3.5 text-[#444746] rounded-full hover:bg-[#e0e3e7] w-full transition-colors">
              <LogOut size={22} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen bg-white md:rounded-tl-[2rem] md:my-4 md:mr-4 shadow-sm border border-slate-100/50 relative">
        <header className="hidden md:flex h-20 bg-white/90 backdrop-blur-sm px-8 items-center justify-between sticky top-0 z-10 rounded-tl-[2rem]">
            <h1 className="text-2xl font-normal text-[#1f1f1f] capitalize">
                {currentView === 'settings' ? 'Account Settings' : 
                 currentView === 'learning' ? 'My Learning' : 
                 navItems[user.role].find(i => i.id === currentView)?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
                {/* Google-style Search Bar */}
                <div className="bg-[#f0f4f9] rounded-full px-4 py-2.5 flex items-center gap-3 w-64 transition-all focus-within:bg-white focus-within:shadow-md focus-within:w-80">
                    <Search size={20} className="text-slate-500" />
                    <input className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-500" placeholder="Search..." />
                </div>

                <button className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-full relative transition-colors">
                    <Bell size={22} />
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>
        <div className="p-4 md:px-8 md:pb-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};