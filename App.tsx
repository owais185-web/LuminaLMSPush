
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ChatWidget } from './components/ChatWidget';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { db } from './services/db';
import { UserRole, User } from './types';

const App: React.FC = () => {
  // State
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [currentView, setCurrentView] = useState<string>('');

  // Default view mapping by role
  const defaultViews: Record<UserRole, string> = {
    admin: 'overview',
    teacher: 'courses',
    student: 'learning'
  };

  // Initialize Session
  useEffect(() => {
    const restoreSession = () => {
        try {
            const storedUserId = localStorage.getItem('lumina_session_user');
            if (storedUserId) {
                const user = db.users.findById(storedUserId);
                if (user) {
                    setCurrentUser(user);
                    setIsAuthenticated(true);
                    // Restore last view or default to role home
                    const lastView = localStorage.getItem('lumina_last_view');
                    setCurrentView(lastView || defaultViews[user.role]);
                }
            }
        } catch (e) {
            console.error("Session restore failed", e);
        } finally {
            // Small artificial delay to prevent flash if checking is instant, 
            // and gives a sense of "App Loading"
            setTimeout(() => setIsSessionLoading(false), 500);
        }
    };
    restoreSession();
  }, []);

  const handleLogin = (user: User) => {
    // Save Session
    localStorage.setItem('lumina_session_user', user.id);
    const view = defaultViews[user.role];
    localStorage.setItem('lumina_last_view', view);

    setCurrentUser(user);
    setCurrentView(view);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear Session
    localStorage.removeItem('lumina_session_user');
    localStorage.removeItem('lumina_last_view');

    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('');
  };

  const handleRoleChange = (role: UserRole) => {
    const users = db.users.getAll();
    const user = users.find(u => u.role === role);
    if (user) {
        // Update Session for new role (Dev/Demo feature)
        localStorage.setItem('lumina_session_user', user.id);
        const view = defaultViews[role];
        localStorage.setItem('lumina_last_view', view);

        setCurrentUser(user);
        setCurrentView(view);
    }
  };

  const handleViewChange = (view: string) => {
      setCurrentView(view);
      localStorage.setItem('lumina_last_view', view);
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    if (currentView === 'settings') {
        return <SettingsPage currentUser={currentUser} />;
    }

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard view={currentView} />;
      case 'teacher':
        return <TeacherDashboard view={currentView} />;
      case 'student':
        return <StudentDashboard 
            view={currentView} 
            currentUser={currentUser} 
            onUserUpdate={setCurrentUser}
        />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  if (isSessionLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Initializing Lumina...</p>
        </div>
      );
  }

  if (!isAuthenticated || !currentUser) {
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout}
      onChangeRole={handleRoleChange}
      currentView={currentView}
      onViewChange={handleViewChange}
    >
      {renderDashboard()}
      <ChatWidget currentUser={currentUser} />
    </Layout>
  );
};

export default App;
