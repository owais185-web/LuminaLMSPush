
import React, { useState } from 'react';
import { User } from '../types';
import { Card, Button, InputField, Badge } from '../components/Common';
import { db } from '../services/db';
import { Shield, User as UserIcon, CheckCircle } from 'lucide-react';

interface SettingsPageProps {
  currentUser: User;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handlePasswordChange = () => {
    setStatus(null);
    
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        setStatus({ type: 'error', message: 'All fields are required.' });
        return;
    }
    if (newPassword !== confirmPassword) {
        setStatus({ type: 'error', message: 'New passwords do not match.' });
        return;
    }

    // Check against current user password (stored in DB)
    // In a real app, this check happens on server. Here we check local DB.
    const storedUser = db.users.find(currentUser.email);
    if (!storedUser) {
         setStatus({ type: 'error', message: 'User not found.' });
         return;
    }

    // Handles legacy data or current password check
    const isCurrentPasswordValid = storedUser.password === currentPassword || (!storedUser.password && currentPassword === 'password123');

    if (!isCurrentPasswordValid) {
        setStatus({ type: 'error', message: 'Incorrect current password.' });
        return;
    }

    // Update
    const updatedUser = { ...storedUser, password: newPassword };
    db.users.update(updatedUser);
    
    setStatus({ type: 'success', message: 'Password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
            <p className="text-slate-500">Manage your profile and security preferences.</p>
        </div>

        <Card title="Public Profile">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 text-center">
                     <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover mb-3" />
                     <Button variant="secondary" className="text-xs w-full">Change Avatar</Button>
                </div>
                <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Full Name" value={currentUser.name} disabled className="bg-slate-50" />
                        <InputField label="Email Address" value={currentUser.email} disabled className="bg-slate-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <Badge color="blue">{currentUser.role.toUpperCase()}</Badge>
                    </div>
                </div>
            </div>
        </Card>

        <Card title="Security & Password">
            <div className="space-y-4 max-w-lg">
                {status && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                        status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {status.type === 'success' ? <CheckCircle size={16}/> : <Shield size={16}/>}
                        {status.message}
                    </div>
                )}
                
                <InputField 
                    label="Current Password" 
                    type="password" 
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                />
                <div className="border-t border-slate-100 my-4"></div>
                <InputField 
                    label="New Password" 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    helperText="Must be at least 8 characters long."
                />
                <InputField 
                    label="Confirm New Password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />
                <div className="pt-2">
                    <Button onClick={handlePasswordChange}>Update Password</Button>
                </div>
            </div>
        </Card>
    </div>
  );
};
