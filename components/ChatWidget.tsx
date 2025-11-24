import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Paperclip, File, X, ChevronDown, MoreVertical } from 'lucide-react';
import { Message, User, Course } from '../types';
import { db } from '../services/db';

interface ChatWidgetProps {
  currentUser: User;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachment, setAttachment] = useState<{name: string, type: 'image'|'file'} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Channels
  const [activeChannel, setActiveChannel] = useState('general');
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [userCourses, setUserCourses] = useState<Course[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        const allCourses = db.courses.getAll();
        const myCourses = allCourses.filter(c => currentUser.enrolledCourses?.includes(c.id));
        setUserCourses(myCourses);

        const allMsgs = db.messages.getAll();
        const relevant = allMsgs.filter(m => m.channelId === activeChannel || m.senderId === currentUser.id || m.receiverId === currentUser.id);
        setMessages(relevant.filter(m => m.channelId === activeChannel)); 
        scrollToBottom();
    }
  }, [isOpen, currentUser.id, activeChannel]);

  useEffect(() => {
      if (!isOpen) return;
      const interval = setInterval(() => {
          const allMsgs = db.messages.getAll();
          const relevant = allMsgs.filter(m => m.channelId === activeChannel);
          if (relevant.length !== messages.length) {
              setMessages(relevant);
              scrollToBottom();
          }
      }, 2000);
      return () => clearInterval(interval);
  }, [isOpen, messages.length, activeChannel]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachment) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: inputValue,
      timestamp: new Date(),
      channelId: activeChannel,
      attachment: attachment ? { ...attachment, url: '#' } : undefined
    };

    db.messages.add(newMessage);

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setAttachment(null);
    scrollToBottom();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setAttachment({
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' : 'file'
          });
      }
  };

  const getChannelName = (id: string) => {
      if (id === 'general') return 'General Discussion';
      const course = userCourses.find(c => c.id === id);
      return course ? course.title : 'Unknown Channel';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-[400px] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-200 border border-slate-100">
          {/* Header - Material 3 Top App Bar style */}
          <div className="bg-white p-4 flex justify-between items-center border-b border-slate-100 z-10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowChannelMenu(!showChannelMenu)}>
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-[#1f1f1f] text-sm truncate max-w-[180px]">{getChannelName(activeChannel)}</span>
                        <ChevronDown size={16} className="text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500">Online</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                 <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600"><X size={20} /></button>
            </div>
            
            {/* Channel Menu */}
            {showChannelMenu && (
                <div className="absolute top-[70px] left-4 w-[90%] bg-[#f8fafe] rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-20 py-2">
                    <button 
                        onClick={() => { setActiveChannel('general'); setShowChannelMenu(false); }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors ${activeChannel === 'general' ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'}`}
                    >
                        General Discussion
                    </button>
                    {userCourses.map(c => (
                         <button 
                            key={c.id}
                            onClick={() => { setActiveChannel(c.id); setShowChannelMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors truncate ${activeChannel === c.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'}`}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            )}
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="text-blue-200" />
                    </div>
                    <p className="text-sm text-slate-500">No messages yet.<br/>Start the conversation!</p>
                </div>
            )}
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser.id;
              const showAvatar = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                  {!isMe && showAvatar && <span className="text-[10px] text-slate-500 ml-3 mb-1">{msg.senderName}</span>}
                  <div className={`max-w-[80%] px-4 py-2.5 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-[20px] rounded-br-[4px]' 
                      : 'bg-[#f0f4f9] text-[#1f1f1f] rounded-[20px] rounded-bl-[4px]'
                  } ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                    
                    {msg.attachment && (
                        <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 ${isMe ? 'bg-white/20' : 'bg-white'}`}>
                            <Paperclip size={14} />
                            <span className="italic truncate max-w-[150px]">{msg.attachment.name}</span>
                        </div>
                    )}

                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] mt-1 opacity-60 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Floating Pill */}
          <div className="p-4 bg-white">
            {attachment && (
                <div className="flex items-center justify-between bg-[#f0f4f9] px-4 py-2 rounded-xl mb-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <File size={14}/>
                        <span className="truncate max-w-[200px]">{attachment.name}</span>
                    </div>
                    <button onClick={() => setAttachment(null)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2 items-center bg-[#f0f4f9] p-1.5 pl-4 rounded-full border border-transparent focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-sm transition-all">
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                >
                    <Paperclip size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message"
                    className="flex-1 bg-transparent text-sm focus:outline-none py-2"
                />
                <button 
                    type="submit" 
                    disabled={!inputValue.trim() && !attachment}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                >
                    <Send size={18} className="ml-0.5" />
                </button>
            </form>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <MessageSquare size={28} strokeWidth={2.5} />
        {/* Unread Indicator */}
        <span className="absolute top-0 right-0 translate-x-[-10px] translate-y-[10px] w-3 h-3 bg-red-400 rounded-full border-2 border-white"></span>
      </button>
    </div>
  );
};